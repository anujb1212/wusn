import 'dart:async';
import 'package:flutter/foundation.dart';

import '../models/crop_recommendation.dart';
import '../models/field_model.dart';
import '../models/gdd_status.dart';
import '../models/irrigation_decision.dart';
import '../models/sensor_data.dart';
import '../services/api_service.dart';

class SensorProvider with ChangeNotifier {
  static const String kSensorZeroReading = 'SENSOR_ZERO_READING';
  static const String kInvalidNodeId = 'INVALID_NODE_ID';
  static const String kInsufficientReadings = 'INSUFFICIENT_READINGS';
  static const String kMoistureUnavailable = 'MOISTURE_UNAVAILABLE';

  List<Field> _fields = <Field>[];
  List<SensorData> _sensors = <SensorData>[];
  bool _isLoading = false;
  String _errorMessage = '';
  bool _isWebSocketConnected = false;
  DateTime? _lastFetchedAt;

  Timer? _pollingTimer;
  bool _disposed = false;
  bool _fetchInFlight = false;
  DateTime? _lastMqttUiUpdate;

  List<Field> get fields => _fields;
  List<SensorData> get sensors => _sensors;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isWebSocketConnected => _isWebSocketConnected;
  DateTime? get lastFetchedAt => _lastFetchedAt;

  /// - 'live'     : MQTT connected
  /// - 'polling'  : MQTT off but recent HTTP fetch succeeded
  /// - 'offline'  : neither MQTT nor recent HTTP activity
  String get connectionStateLabel {
    if (_isWebSocketConnected) return 'live';

    if (_lastFetchedAt != null) {
      final diff = DateTime.now().difference(_lastFetchedAt!);
      // If we have fetched data within the last 15 minutes, treat as polling.
      if (diff.inMinutes < 15) return 'polling';
    }

    return 'offline';
  }

  SensorProvider() {
    fetchData();
    _pollingTimer = Timer.periodic(
      const Duration(minutes: 15),
      (_) => fetchData(silent: true),
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }

  void _debugLog(String msg) {
    if (kDebugMode) debugPrint(msg);
  }

  Future<void> fetchData({bool silent = false}) async {
    if (_disposed) return;

    // Prevent overlapping runs (e.g., slow network + periodic timer).
    if (_fetchInFlight) return;
    _fetchInFlight = true;

    if (!silent) {
      _isLoading = true;
      _errorMessage = '';
      _safeNotify();
    }

    try {
      final fields = await ApiService.getFields(); // List<Field>
      _fields = fields;

      if (fields.isEmpty) {
        _sensors = <SensorData>[];
      } else {
        // Build each field card independently; never throw out the whole list.
        final futures = fields.map(_buildDataForField);

        // If something unexpected throws, don't fail-fast; keep as many cards as possible.
        _sensors = await Future.wait<SensorData>(futures, eagerError: false);
      }

      _errorMessage = '';
    } catch (e) {
      _errorMessage =
          'Unable to fetch data. Please check your internet connection.';
      _debugLog('fetchData error: $e');
    } finally {
      _isLoading = false;
      _fetchInFlight = false;
      _lastFetchedAt = DateTime.now();
      _safeNotify();
    }
  }

  // -------------------- Safe wrappers (nullable futures) --------------------

  Future<SensorData?> _safeGetLatestSensorData(int nodeId) async {
    try {
      return await ApiService.getLatestSensorData(nodeId);
    } catch (e) {
      _debugLog('Latest sensor fetch failed for nodeId=$nodeId: $e');
      return null;
    }
  }

  Future<IrrigationDecision?> _safeGetIrrigationDecision(int nodeId) async {
    try {
      return await ApiService.getIrrigationDecision(nodeId);
    } catch (e) {
      // Often fails if crop not confirmed; treat as "no irrigation decision yet".
      _debugLog('Irrigation decision unavailable for nodeId=$nodeId: $e');
      return null;
    }
  }

  Future<CropRecommendation?> _safeGetCropRecommendations(int nodeId) async {
    try {
      return await ApiService.getCropRecommendations(nodeId);
    } catch (e) {
      _debugLog('Crop recommendations unavailable for nodeId=$nodeId: $e');
      return null;
    }
  }

  Future<GDDStatus?> _safeGetGddStatus(int nodeId) async {
    try {
      return await ApiService.getGDDStatus(nodeId);
    } catch (e) {
      _debugLog('GDD status unavailable for nodeId=$nodeId: $e');
      return null;
    }
  }

  // -------------------- Build one card worth of data --------------------

  Future<SensorData> _buildDataForField(Field field) async {
    final nodeId = field.nodeId;

    // Always return a safe object (UI should never break).
    SensorData data = SensorData.initial(nodeId, field.fieldName);

    try {
      // Run in parallel, but each is individually safe.
      final results = await Future.wait<Object?>(<Future<Object?>>[
        _safeGetLatestSensorData(nodeId),
        _safeGetIrrigationDecision(nodeId),
        (field.cropType != null && field.cropType!.isNotEmpty)
            ? Future.value(null)
            : _safeGetCropRecommendations(nodeId),
        _safeGetGddStatus(nodeId),
      ], eagerError: false);

      final SensorData? latest = results[0] as SensorData?;
      final IrrigationDecision? irrigation = results[1] as IrrigationDecision?;
      final CropRecommendation? cropRec =
          field.cropType != null && field.cropType!.isNotEmpty
              ? null
              : results[2] as CropRecommendation?;
      final GDDStatus? gddStatus = results[3] as GDDStatus?;

      // Without latest sensor data, stop here (keep initial + clear summary).
      if (latest == null) {
        return data.copyWith(
          summary: 'No sensor reading received yet for this field.',
          soilStatus: 'unknown',
          irrigationAdvice: field.cropType == null
              ? 'Confirm crop to unlock irrigation advice.'
              : 'Waiting for first sensor reading...',
          confidence: 0.0,
          fuzzyScores: const FuzzyScores(dry: 0.0, optimal: 0.0, wet: 0.0),
          cropType: field.cropType ?? '',
        );
      }

      if (latest.nodeId == 0 && field.nodeId == 0) {
        return data.copyWith(
          summary: SensorProvider.kInvalidNodeId,
          soilStatus: 'unknown',
          irrigationAdvice: SensorProvider.kInvalidNodeId,
        );
      }

      if (latest.vwc == 0.0 && latest.soilTemp == 0.0) {
        return data.copyWith(
          summary:
              'Sensor is connected but has not reported valid readings yet.',
          soilStatus: 'unknown',
          irrigationAdvice: field.cropType == null
              ? 'Confirm crop to unlock irrigation advice.'
              : 'Waiting for valid sensor readings...',
          fuzzyScores: const FuzzyScores(dry: 0.0, optimal: 0.0, wet: 0.0),
          cropType: field.cropType ?? '',
        );
      }

      // Base = latest sensor data, but preserve fieldName from Field list for consistent UI labels.
      data = latest.copyWith(fieldName: field.fieldName);
      data = data.copyWith(cropType: field.cropType ?? '');

      // ---- Irrigation overlay ----
      if (irrigation == null) {
        // No irrigation decision -> fallback from VWC
        final status = _statusFromVwc(
          vwc: latest.vwc,
          vwcMin: latest.vwcMin,
          vwcOptimal: latest.vwcOptimal,
          vwcMax: latest.vwcMax,
        );

        data = data.copyWith(
          soilStatus: status,
          irrigationAdvice: field.cropType == null
              ? 'Please confirm crop to get irrigation advice'
              : 'Waiting for irrigation analysis...',
          confidence: 0.0,
          fuzzyScores: _basicFuzzyFromVwc(
            vwc: latest.vwc,
            vwcMin: latest.vwcMin,
            vwcOptimal: latest.vwcOptimal,
            vwcMax: latest.vwcMax,
          ),
        );
      } else {
        if (irrigation.currentVWC == 0.0 && irrigation.targetVWC > 0) {
          data = data.copyWith(
            irrigationAdvice: SensorProvider.kMoistureUnavailable,
            soilStatus: 'unknown',
            confidence: 0.0,
          );
        } else {
          data = data.copyWith(
            soilStatus: _statusFromUrgency(
              irrigation.urgency,
              currentVWC: irrigation.currentVWC,
              targetVWC: irrigation.targetVWC,
            ),
            irrigationAdvice: irrigation.reasonEn,
            confidence: irrigation.urgencyScore,
            fuzzyScores: _fuzzyFromIrrigation(irrigation),
          );
        }
      }

      // ---- Crop recommendation overlay ----
      if (cropRec != null && cropRec.topCrops.isNotEmpty) {
        final top = cropRec.topCrops.first;

        if (top.totalScore == 0) {
          data = data.copyWith(
            summary: SensorProvider.kInsufficientReadings,
          );
        } else {
          final alternatives = cropRec.topCrops
              .skip(1)
              .take(3)
              .map(
                (c) => CropSuitability(
                  cropName: c.cropName,
                  suitability: c.totalScore.toDouble(),
                  reason: c.reason,
                ),
              )
              .toList();

          data = data.copyWith(
            bestCrop: top.cropName,
            cropConfidence: top.totalScore.toDouble(),
            alternativeCrops: alternatives,
            summary: top.reason.isNotEmpty
                ? top.reason
                : 'Top crop: ${top.cropName}',
          );
        }
      }

      // ---- Optional GDD snapshot ----
      final gdd = gddStatus?.gddData;
      if (gdd != null) {
        final days = gdd.estimatedDaysToHarvest;
        final gddSummary = 'GDD: ${gdd.progressPercent.toStringAsFixed(1)}%'
            '${days == null ? '' : ' • ${days.toStringAsFixed(0)} days to harvest'}';
        final existingSummary =
            data.summary.isNotEmpty && data.summary != 'Loading data...'
                ? data.summary
                : '';
        final combined = existingSummary.isNotEmpty
            ? '$existingSummary\n$gddSummary'
            : gddSummary;
        data = data.copyWith(summary: combined);
      }

      final growthDays = gddStatus?.growthInfo?.estimatedDaysToHarvest;
      if (growthDays != null && growthDays > 0) {
        data = data.copyWith(estimatedDaysToHarvest: growthDays);
      } else if (gdd?.estimatedDaysToHarvest != null) {
        data =
            data.copyWith(estimatedDaysToHarvest: gdd!.estimatedDaysToHarvest);
      }
    } catch (e) {
      // Keep card usable; do not throw.
      _debugLog('Partial load error for nodeId=$nodeId: $e');
    }

    if ((field.cropType == null || field.cropType!.isEmpty) &&
        field.sowingDate == null) {
      final existingSummary = data.summary;
      data = data.copyWith(
        summary: existingSummary.isNotEmpty
            ? '$existingSummary\nCollect 3–7 days of readings before confirming crop.'
            : 'Collect 3–7 days of readings before confirming crop.',
      );
    }

    return data;
  }

  // -------------------- Helpers --------------------

  String _statusFromUrgency(
    String urgency, {
    double? currentVWC,
    double? targetVWC,
  }) {
    if (currentVWC != null &&
        targetVWC != null &&
        !currentVWC.isNaN &&
        !targetVWC.isNaN &&
        targetVWC > 0) {
      if (currentVWC > targetVWC * 1.05) return 'too_wet';
    }

    switch (urgency) {
      case 'CRITICAL':
      case 'HIGH':
      case 'MODERATE':
        return 'needs_water';
      case 'LOW':
      case 'NONE':
      default:
        return 'optimal';
    }
  }

  String _statusFromVwc({
    required double vwc,
    double? vwcMin,
    double? vwcOptimal,
    double? vwcMax,
  }) {
    // Prefer backend-provided ranges if present.
    if (vwcMin != null && vwcMax != null) {
      if (vwc < vwcMin) return 'needs_water';
      if (vwc > vwcMax) return 'too_wet';
      return 'optimal';
    }

    // Fallback thresholds
    if (vwc < 20) return 'needs_water';
    if (vwc > 40) return 'too_wet';
    return 'optimal';
  }

  FuzzyScores _basicFuzzyFromVwc({
    required double vwc,
    double? vwcMin,
    double? vwcOptimal,
    double? vwcMax,
  }) {
    // If backend gives min/optimal/max, shape membership around optimal.
    if (vwcMin != null && vwcOptimal != null && vwcMax != null) {
      final dry = vwc <= vwcMin
          ? 100.0
          : (vwc < vwcOptimal
              ? ((vwcOptimal - vwc) / (vwcOptimal - vwcMin)) * 100.0
              : 0.0);

      final wet = vwc >= vwcMax
          ? 100.0
          : (vwc > vwcOptimal
              ? ((vwc - vwcOptimal) / (vwcMax - vwcOptimal)) * 100.0
              : 0.0);

      final optimal = (100.0 - dry - wet).clamp(0.0, 100.0).toDouble();

      return FuzzyScores(
        dry: dry.clamp(0.0, 100.0).toDouble(),
        optimal: optimal,
        wet: wet.clamp(0.0, 100.0).toDouble(),
      );
    }

    // Simple fallback piecewise membership (VWC%)
    double dry = 0.0, optimal = 0.0, wet = 0.0;

    if (vwc < 15) {
      dry = 100.0;
    } else if (vwc < 25) {
      dry = (25 - vwc) / 10 * 100.0;
      optimal = (vwc - 15) / 10 * 100.0;
    } else if (vwc < 35) {
      optimal = 100.0;
    } else if (vwc < 45) {
      optimal = (45 - vwc) / 10 * 100.0;
      wet = (vwc - 35) / 10 * 100.0;
    } else {
      wet = 100.0;
    }

    return FuzzyScores(
      dry: dry.clamp(0.0, 100.0).toDouble(),
      optimal: optimal.clamp(0.0, 100.0).toDouble(),
      wet: wet.clamp(0.0, 100.0).toDouble(),
    );
  }

  FuzzyScores _fuzzyFromIrrigation(IrrigationDecision irrigation) {
    if (irrigation.currentVWC.isNaN || irrigation.targetVWC <= 0) {
      return const FuzzyScores(dry: 0.0, optimal: 0.0, wet: 0.0);
    }

    final current = irrigation.currentVWC;
    final target = irrigation.targetVWC <= 0 ? 1.0 : irrigation.targetVWC;

    if (current > target) {
      final excessPct =
          (((current - target) / target) * 100).clamp(0.0, 100.0).toDouble();
      return FuzzyScores(
        dry: 0.0,
        optimal: (100.0 - excessPct).clamp(0.0, 100.0).toDouble(),
        wet: excessPct,
      );
    }

    final depletionPct =
        (((target - current) / target) * 100).clamp(0.0, 100.0).toDouble();

    // dry increases linearly with depletion; optimal = remainder; wet = 0
    // This guarantees dry + optimal + wet == 100 always
    final dry = depletionPct;
    final optimal = (100.0 - depletionPct).clamp(0.0, 100.0).toDouble();

    return FuzzyScores(
      dry: dry,
      optimal: optimal,
      wet: 0.0,
    );
  }

  // -------------------- MQTT updates --------------------

  double _toDouble(dynamic v, {required double fallback}) {
    if (v == null) return fallback;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  void onMqttDataReceived(int nodeId, Map<String, dynamic> payload) {
    if (_disposed) return;

    final now = DateTime.now();
    if (_lastMqttUiUpdate != null &&
        now.difference(_lastMqttUiUpdate!) < const Duration(seconds: 30)) {
      return;
    }
    _lastMqttUiUpdate = now;

    final index = _sensors.indexWhere((s) => s.nodeId == nodeId);
    if (index == -1) return;

    final current = _sensors[index];

    final vwc = _toDouble(payload['vwc'] ?? payload['soilMoistureVWC'],
        fallback: current.vwc);
    final soilTemp = _toDouble(
        payload['soilTemp'] ?? payload['soilTemperature'],
        fallback: current.soilTemp);

    final airTempRaw = payload['airTemp'] ?? payload['airTemperature'];
    final double? airTemp = airTempRaw == null
        ? current.airTemp
        : _toDouble(airTempRaw, fallback: current.airTemp ?? 0.0);

    // If we currently have no irrigation decision confidence, keep fuzzy derived from VWC.
    final shouldAutoUpdateFuzzy = current.confidence == 0.0;

    _sensors[index] = current.copyWith(
      vwc: vwc,
      soilTemp: soilTemp,
      airTemp: airTemp,
      timestamp: DateTime.now().toUtc(),
      soilStatus: current.confidence > 0
          ? current.soilStatus
          : _statusFromVwc(
              vwc: vwc,
              vwcMin: current.vwcMin,
              vwcOptimal: current.vwcOptimal,
              vwcMax: current.vwcMax,
            ),
      fuzzyScores: shouldAutoUpdateFuzzy
          ? _basicFuzzyFromVwc(
              vwc: vwc,
              vwcMin: current.vwcMin,
              vwcOptimal: current.vwcOptimal,
              vwcMax: current.vwcMax,
            )
          : current.fuzzyScores,
    );

    _safeNotify();
  }

  void updateWebSocketStatus(bool isConnected) {
    // Kept name for backward compatibility; used by MQTT service callback today.
    if (_disposed) return;
    if (_isWebSocketConnected == isConnected) return;
    _isWebSocketConnected = isConnected;
    _safeNotify();
  }
}
