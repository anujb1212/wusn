import 'package:flutter/foundation.dart';
import 'dart:async';
import '../services/api_service.dart';
import '../models/sensor_data.dart';
import '../models/field_model.dart';

class SensorProvider with ChangeNotifier {
  List<SensorData> _sensors = [];
  bool _isLoading = false;
  String _errorMessage = '';
  bool _isWebSocketConnected = false;
  Timer? _pollingTimer;

  List<SensorData> get sensors => _sensors;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isWebSocketConnected => _isWebSocketConnected;

  SensorProvider() {
    fetchData();
    _pollingTimer = Timer.periodic(
        const Duration(minutes: 5), (_) => fetchData(silent: true));
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> fetchData({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = '';
      notifyListeners();
    }

    try {
      final fieldsJson = await ApiService.getFields();
      final fields =
          fieldsJson.map<Field>((json) => Field.fromJson(json)).toList();

      if (fields.isEmpty) {
        _sensors = [];
      } else {
        final futures = fields.map((field) => _buildDataForField(field));
        _sensors = await Future.wait(futures);
      }
      _errorMessage = '';
    } catch (e) {
      _errorMessage = 'Connection Error: Please check server.';
      print('❌ fetchData error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<SensorData> _buildDataForField(Field field) async {
    final nodeId = field.id;
    var data = SensorData.initial(nodeId, field.fieldName);

    try {
      final results = await Future.wait<Map<String, dynamic>>([
        ApiService.getLatestSensorData(nodeId).catchError((e) {
          print('⚠️ Sensor data error for node $nodeId: $e');
          return <String, dynamic>{};
        }),
        ApiService.getIrrigationDecision(nodeId).catchError((e) {
          print(
              '⚠️ Irrigation decision error for node $nodeId (expected if crop not confirmed): $e');
          return <String, dynamic>{};
        }),
        ApiService.getCropRecommendations(nodeId).catchError((e) {
          print('⚠️ Crop recommendation error for node $nodeId: $e');
          return <String, dynamic>{};
        }),
      ]);

      final sensorRes = results[0];
      final irrigationRes = results[1];
      final cropRes = results[2];

      // ✅ Merge sensor data
      if (sensorRes.isNotEmpty) {
        final moisture = (sensorRes['moisture'] ?? 0).toInt();

        data = data.copyWith(
          moisture: moisture,
          temperature: (sensorRes['temperature'] ?? 0).toDouble(),
          timestamp:
              DateTime.tryParse(sensorRes['timestamp'] ?? '') ?? DateTime.now(),
        );

        // ✅ Calculate basic fuzzy scores from moisture if no irrigation data
        if (irrigationRes.isEmpty) {
          final fuzzy = _calculateBasicFuzzyScores(moisture.toDouble());
          data = data.copyWith(
            soilStatus: _getSoilStatusFromMoisture(moisture.toDouble()),
            irrigationAdvice: field.cropType == null
                ? 'Please confirm crop to get irrigation advice'
                : 'Waiting for irrigation analysis...',
            confidence: 0.0,
            fuzzyScores: fuzzy,
          );
        }
      }

      // ✅ Merge Irrigation Analysis (only if available)
      if (irrigationRes.isNotEmpty) {
        String status = 'optimal';
        final urgency = irrigationRes['urgency'] ?? 'LOW';

        if (urgency == 'CRITICAL' || urgency == 'HIGH') {
          status = 'needs_water';
        } else if (urgency == 'LOW' && (sensorRes['moisture'] ?? 0) > 80) {
          status = 'too_wet';
        }

        // ✅ Calculate fuzzy scores from irrigation data
        final currentVWC =
            (irrigationRes['currentVWC'] ?? sensorRes['moisture'] ?? 0)
                .toDouble();
        final targetVWC = (irrigationRes['targetVWC'] ?? 25).toDouble();

        // Calculate depletion percentage
        final depletion =
            ((targetVWC - currentVWC) / targetVWC * 100).clamp(0, 100);

        // Generate fuzzy membership
        FuzzyScores fuzzyScores;
        if (depletion > 70) {
          // Critical/High - mostly dry
          fuzzyScores = FuzzyScores(
            dry: depletion,
            optimal: (100 - depletion) / 2,
            wet: 0,
          );
        } else if (depletion > 40) {
          // Moderate - mostly optimal
          fuzzyScores = FuzzyScores(
            dry: depletion / 2,
            optimal: ((100 - depletion) / 2).toDouble(),
            wet: 0,
          );
        } else {
          // Low - balanced
          fuzzyScores = FuzzyScores(
            dry: 0,
            optimal: ((100 - depletion) / 2).toDouble(),
            wet: depletion,
          );
        }

        // ✅ Extract confidence from urgencyScore (0-100 scale)
        final confidence = (irrigationRes['urgencyScore'] ??
                (urgency == 'HIGH'
                    ? 80
                    : urgency == 'MODERATE'
                        ? 60
                        : 40))
            .toDouble();

        data = data.copyWith(
          soilStatus: status,
          irrigationAdvice: irrigationRes['reason'] ?? 'No advice available',
          confidence: confidence,
          fuzzyScores: fuzzyScores,
        );
      }

      // ✅ Merge Crop Recommendations
      if (cropRes.isNotEmpty) {
        final dynamic inner = cropRes['data'];
        if (inner is Map<String, dynamic>) {
          final String? recommendedCrop = inner['recommendedCrop'];
          final List<dynamic> topCrops = (inner['topCrops'] as List?) ?? [];

          if (recommendedCrop != null && topCrops.isNotEmpty) {
            final Map<String, dynamic> topCrop =
                topCrops.first as Map<String, dynamic>;

            data = data.copyWith(
              bestCrop: recommendedCrop,
              cropConfidence: (topCrop['totalScore'] ?? 0).toDouble(),
              summary: topCrop['explanation'] ?? "Best fit: $recommendedCrop",
              alternativeCrops: topCrops
                  .skip(1)
                  .take(3)
                  .map((e) =>
                      CropSuitability.fromJson(e as Map<String, dynamic>))
                  .toList(),
            );
          }
        }
      }
    } catch (e) {
      print('⚠️ Partial load error for Node $nodeId: $e');
    }
    return data;
  }

  /// ✅ Calculate basic fuzzy scores from moisture when irrigation API unavailable
  FuzzyScores _calculateBasicFuzzyScores(double moisture) {
    double dry = 0, optimal = 0, wet = 0;

    if (moisture < 15) {
      dry = 100;
    } else if (moisture < 25) {
      dry = (25 - moisture) / 10 * 100;
      optimal = (moisture - 15) / 10 * 100;
    } else if (moisture < 35) {
      optimal = 100;
    } else if (moisture < 45) {
      optimal = (45 - moisture) / 10 * 100;
      wet = (moisture - 35) / 10 * 100;
    } else {
      wet = 100;
    }

    return FuzzyScores(
      dry: dry.clamp(0, 100),
      optimal: optimal.clamp(0, 100),
      wet: wet.clamp(0, 100),
    );
  }

  /// ✅ Get soil status from moisture percentage
  String _getSoilStatusFromMoisture(double moisture) {
    if (moisture < 20) return 'needs_water';
    if (moisture > 40) return 'too_wet';
    return 'optimal';
  }

  void onMqttDataReceived(int nodeId, Map<String, dynamic> payload) {
    final index = _sensors.indexWhere((s) => s.nodeId == nodeId);
    if (index != -1) {
      final moisture = payload['moisture'] ?? _sensors[index].moisture;

      _sensors[index] = _sensors[index].copyWith(
        moisture: moisture,
        temperature:
            (payload['temperature'] ?? _sensors[index].temperature).toDouble(),
        timestamp: DateTime.now(),
      );

      // ✅ Update fuzzy scores in real-time if no irrigation data
      if (_sensors[index].confidence == 0.0) {
        final fuzzy = _calculateBasicFuzzyScores(moisture.toDouble());
        _sensors[index] = _sensors[index].copyWith(
          soilStatus: _getSoilStatusFromMoisture(moisture.toDouble()),
          fuzzyScores: fuzzy,
        );
      }

      notifyListeners();
    }
  }

  void updateWebSocketStatus(bool isConnected) {
    _isWebSocketConnected = isConnected;
    notifyListeners();
  }
}
