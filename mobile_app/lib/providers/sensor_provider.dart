import 'dart:async';
import 'package:flutter/foundation.dart';

import '../models/crop_recommendation.dart';
import '../models/field_model.dart';
import '../models/gdd_status.dart';
import '../models/irrigation_decision.dart';
import '../models/sensor_data.dart';
import '../services/api_service.dart';

class SensorProvider with ChangeNotifier {
  List<SensorData> _sensors = <SensorData>[];
  bool _isLoading = false;
  String _errorMessage = '';
  bool _isWebSocketConnected = false;

  Timer? _pollingTimer;
  bool _disposed = false;
  bool _fetchInFlight = false;

  List<SensorData> get sensors => _sensors;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isWebSocketConnected => _isWebSocketConnected;

  SensorProvider() {
    fetchData();
    _pollingTimer = Timer.periodic(
      const Duration(minutes: 5),
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
      _errorMessage = 'Connection Error: Please check server.';
      _debugLog('fetchData error: $e');
    } finally {
      _isLoading = false;
      _fetchInFlight = false;
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
        _safeGetCropRecommendations(nodeId),
        _safeGetGddStatus(nodeId),
      ], eagerError: false);

      final SensorData? latest = results[0] as SensorData?;
      final IrrigationDecision? irrigation = results[1] as IrrigationDecision?;
      final CropRecommendation? cropRec = results[2] as CropRecommendation?;
      final GDDStatus? gddStatus = results[3] as GDDStatus?;

      // Without latest sensor data, stop here (keep initial + clear summary).
      if (latest == null) {
        return data.copyWith(
          summary: 'No recent sensor data. Check node/gateway connection.',
          soilStatus: 'unknown',
          irrigationAdvice: field.cropType == null
              ? 'Please confirm crop to get irrigation advice'
              : 'Waiting for sensor data...',
          confidence: 0.0,
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
        data = data.copyWith(
          soilStatus: _statusFromUrgency(irrigation.urgency),
          irrigationAdvice: irrigation.reasonEn,
          confidence: irrigation.urgencyScore, // 0-100 scale
          fuzzyScores: _fuzzyFromIrrigation(irrigation),
        );
      }

      // ---- Crop recommendation overlay ----
      if (cropRec != null && cropRec.topCrops.isNotEmpty) {
        final top = cropRec.topCrops.first;

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
          summary:
              top.reason.isNotEmpty ? top.reason : 'Top crop: ${top.cropName}',
        );
      }

      // ---- Optional GDD snapshot ----
      final gdd = gddStatus?.gddData;
      if (gdd != null) {
        final days = gdd.estimatedDaysToHarvest;
        final gddSummary = 'GDD: ${gdd.progressPercent.toStringAsFixed(1)}%'
            '${days == null ? '' : ' • ${days.toStringAsFixed(0)} days to harvest'}';
        data = data.copyWith(summary: gddSummary);
      }
    } catch (e) {
      // Keep card usable; do not throw.
      _debugLog('Partial load error for nodeId=$nodeId: $e');
    }

    return data;
  }

  // -------------------- Helpers --------------------

  String _statusFromUrgency(String urgency) {
    switch (urgency) {
      case 'CRITICAL':
      case 'HIGH':
        return 'needs_water';
      case 'MODERATE':
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
    final current = irrigation.currentVWC;
    final target = irrigation.targetVWC <= 0 ? 1.0 : irrigation.targetVWC;

    final depletionPct =
        (((target - current) / target) * 100).clamp(0.0, 100.0).toDouble();

    double dry = 0.0, optimal = 0.0, wet = 0.0;

    if (depletionPct >= 70) {
      dry = depletionPct;
      optimal = (100.0 - depletionPct) / 2.0;
    } else if (depletionPct >= 40) {
      dry = depletionPct / 2.0;
      optimal = (100.0 - depletionPct);
    } else {
      optimal = (100.0 - depletionPct);
      wet = depletionPct / 2.0;
    }

    return FuzzyScores(
      dry: dry.clamp(0.0, 100.0).toDouble(),
      optimal: optimal.clamp(0.0, 100.0).toDouble(),
      wet: wet.clamp(0.0, 100.0).toDouble(),
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
      soilStatus: shouldAutoUpdateFuzzy
          ? _statusFromVwc(
              vwc: vwc,
              vwcMin: current.vwcMin,
              vwcOptimal: current.vwcOptimal,
              vwcMax: current.vwcMax,
            )
          : current.soilStatus,
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
