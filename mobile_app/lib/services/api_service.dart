import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/sensor_data.dart';

class ApiService {
  
  static String _normalizeCropName(String name) {
    return name.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
  }

  static Future<Map<String, dynamic>> _get(String endpoint) async {
    try {
      final response = await http
          .get(
            Uri.parse('${AppConfig.backendUrl}$endpoint'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ API GET Error ($endpoint): $e');
      throw Exception('Connection error: $e');
    }
  }

  /// Make HTTP POST request with error handling
  static Future<Map<String, dynamic>> _post(
      String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.backendUrl}$endpoint'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode(body),
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      } else {
        final errorBody = json.decode(response.body);
        throw Exception(
            errorBody['message'] ?? 'Server error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ API POST Error ($endpoint): $e');
      throw Exception('Connection error: $e');
    }
  }

  // ============================================================================
  // SENSOR DATA ENDPOINTS
  // ============================================================================

  /// Fetch latest sensor readings (LEGACY - backward compatible)
  static Future<List<SensorData>> fetchLatestData() async {
    try {
      final response = await http
          .get(
            Uri.parse('${AppConfig.backendUrl}/api/data/latest'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);

        return jsonData.map((item) {
          final reading = item;
          final analysis = item['analysis'];

          if (analysis == null) {
            return SensorData.fromJson({
              'nodeId': reading['nodeId'],
              'moisture': reading['moisture'],
              'temperature': reading['temperature'],
              'rssi': reading['rssi'],
              'timestamp': reading['timestamp'],
              'soilStatus': 'unknown',
              'irrigationAdvice': 'Processing...',
              'confidence': 0.0,
              'fuzzyScores': {'dry': 0.0, 'optimal': 0.0, 'wet': 0.0},
              'bestCrop': 'unknown',
              'cropConfidence': 0.0,
              'alternativeCrops': [],
              'summary': 'Data being analyzed...',
            });
          }

          final crops = analysis['cropRecommendations'] as List<dynamic>?;
          final bestCrop = crops != null && crops.isNotEmpty
              ? _normalizeCropName(crops[0]['cropName'])
              : 'unknown';
          final bestCropConf = crops != null && crops.isNotEmpty
              ? (crops[0]['suitability'] as num).toDouble()
              : 0.0;
          final altCrops = crops != null && crops.length > 1
              ? crops.sublist(1, crops.length > 3 ? 3 : crops.length).map((crop) {
                  return {
                    'cropName': _normalizeCropName(crop['cropName']),
                    'suitability': (crop['suitability'] as num).toDouble(),
                    'reason': crop['reason'] ?? '',
                  };
                }).toList()
              : [];

          return SensorData.fromJson({
            'nodeId': reading['nodeId'],
            'moisture': reading['moisture'],
            'temperature': reading['temperature'],
            'rssi': reading['rssi'],
            'timestamp': reading['timestamp'],
            'soilStatus': analysis['soilStatus'],
            'irrigationAdvice': analysis['irrigationAdvice'],
            'confidence': (analysis['confidence'] as num).toDouble(),
            'fuzzyScores': {
              'dry': (analysis['fuzzyDryScore'] as num).toDouble(),
              'optimal': (analysis['fuzzyOptimalScore'] as num).toDouble(),
              'wet': (analysis['fuzzyWetScore'] as num).toDouble(),
            },
            'bestCrop': bestCrop,
            'cropConfidence': bestCropConf,
            'alternativeCrops': altCrops,
            'summary': crops != null && crops.isNotEmpty
                ? '${crops[0]['reason']} for $bestCrop'
                : 'Analysis complete',
          });
        }).toList();
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ API Error: $e');
      throw Exception('Connection error: $e');
    }
  }

  /// Get latest sensor readings for a specific node (NEW)
  static Future<List<Map<String, dynamic>>> getNodeReadings(int nodeId,
      {int limit = 10}) async {
    final result = await _get('/api/sensors/$nodeId/latest');
    return List<Map<String, dynamic>>.from(result['readings'] ?? []);
  }

  /// Get all registered nodes (NEW)
  static Future<List<Map<String, dynamic>>> getAllNodes() async {
    final result = await _get('/api/nodes');
    return List<Map<String, dynamic>>.from(result['nodes'] ?? []);
  }

  // ============================================================================
  // GDD (Growing Degree Days) ENDPOINTS
  // ============================================================================

  /// Get GDD status and growth stage for a node (NEW)
  static Future<Map<String, dynamic>> getGDDStatus(int nodeId) async {
    return await _get('/api/gdd/$nodeId/status');
  }

  /// Manually trigger GDD calculation for date range (NEW)
  static Future<Map<String, dynamic>> calculateGDD({
    required int nodeId,
    required String startDate, // Format: 'YYYY-MM-DD'
    required String endDate, // Format: 'YYYY-MM-DD'
  }) async {
    return await _post('/api/gdd/$nodeId/calculate', {
      'startDate': startDate,
      'endDate': endDate,
    });
  }

  // ============================================================================
  // CROP RECOMMENDATION ENDPOINTS
  // ============================================================================

  /// Get crop recommendations based on soil conditions (NEW)
  static Future<Map<String, dynamic>> getCropRecommendations(int nodeId) async {
    return await _get('/api/crops/$nodeId/recommend');
  }

  /// Get list of valid UP crops (NEW)
  static Future<Map<String, dynamic>> getValidCrops() async {
    return await _get('/api/crops/info');
  }

  // ============================================================================
  // IRRIGATION ENDPOINTS
  // ============================================================================

  /// Get irrigation recommendation for a node (NEW - FIXED)
  static Future<Map<String, dynamic>> getIrrigationRecommendation(int nodeId) async {
  try {
    final result = await _get('/api/irrigation/$nodeId/recommend');
    
    print('🔍 Raw backend response: $result');
    
    // Backend returns: 
    // { 
    //   "status": "ok", 
    //   "nodeId": 1, 
    //   "decision": {...},
    //   "weather": {...},
    //   "fieldConfig": {...}
    // }
    
    if (result['status'] == 'ok' && result['decision'] != null) {
      // ✅ FIXED: Merge decision with weather and fieldConfig at top level
      final Map<String, dynamic> response = {
        ...result['decision'] as Map<String, dynamic>,
        'weather': result['weather'],
        'fieldConfig': result['fieldConfig'],
      };
      
      print('✅ Processed response: $response');
      return response;
    }
    
    throw Exception('Invalid irrigation response format');
  } catch (e) {
    print('❌ Irrigation recommendation error: $e');
    rethrow;
  }
}

  /// Record actual irrigation action taken (NEW)
  static Future<Map<String, dynamic>> recordIrrigation({
    required int nodeId,
    required double waterAppliedMm,
  }) async {
    return await _post('/api/irrigation/$nodeId/record', {
      'waterAppliedMm': waterAppliedMm,
    });
  }

  /// Get irrigation advice (LEGACY - Phase 3 compatibility)
  /// This now redirects to the new endpoint
  static Future<Map<String, dynamic>> getIrrigationAdvice(int fieldId) async {
    try {
      // Use new endpoint instead of old /api/irrigation/check
      return await getIrrigationRecommendation(fieldId);
    } catch (e) {
      print('❌ Irrigation advice error: $e');
      throw Exception('Connection error: $e');
    }
  }

  // ============================================================================
  // FIELD CONFIGURATION ENDPOINTS
  // ============================================================================

  /// Configure field with crop, sowing date, and soil type (NEW)
  static Future<Map<String, dynamic>> configureField({
    required int nodeId,
    required String cropType,
    required DateTime sowingDate,
    String? fieldName,
    String soilTexture = 'SANDY_LOAM',
    double? latitude,
    double? longitude,
  }) async {
    return await _post('/api/fields/configure', {
      'nodeId': nodeId,
      'fieldName': fieldName ?? 'Field $nodeId',
      'cropType': cropType,
      'sowingDate': sowingDate.toIso8601String().split('T')[0],
      'soilTexture': soilTexture,
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  /// Confirm crop selection (LEGACY - Phase 2 compatibility)
  static Future<Map<String, dynamic>> confirmCrop({
    required int fieldId,
    required String cropName,
    required DateTime sowingDate,
    String soilType = 'LOAM',
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.backendUrl}/api/crop/confirm'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'fieldId': fieldId,
              'cropName': cropName,
              'sowingDate': sowingDate.toIso8601String().split('T')[0],
              'soilType': soilType,
            }),
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        print('✅ Crop confirmed: $cropName for field $fieldId');
        return result;
      } else {
        final errorBody = json.decode(response.body);
        throw Exception(errorBody['message'] ?? 'Failed to confirm crop: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Crop confirmation error: $e');
      rethrow;
    }
  }

  /// Get field details (LEGACY)
  static Future<Map<String, dynamic>> getFieldDetails(int fieldId) async {
    try {
      final response = await http
          .get(
            Uri.parse('${AppConfig.backendUrl}/api/field/$fieldId'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        
        if (result['status'] == 'ok') {
          return result;
        }
        
        throw Exception('Invalid field response');
      } else if (response.statusCode == 404) {
        // Field not configured yet - return empty
        return {'status': 'not_found', 'field': null};
      } else {
        throw Exception('Failed to get field details: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Field details error: $e');
      rethrow;
    }
  }

  // ============================================================================
  // WEATHER ENDPOINTS
  // ============================================================================

  /// Get weather forecast for coordinates (NEW)
  static Future<Map<String, dynamic>> getWeatherForecast({
    required double latitude,
    required double longitude,
  }) async {
    return await _get('/api/weather/forecast?lat=$latitude&lon=$longitude');
  }

  // ============================================================================
  // ALERTS ENDPOINTS
  // ============================================================================

  /// Get active alerts (EXISTING)
  static Future<List<Map<String, dynamic>>> getActiveAlerts() async {
    try {
      final response = await http
          .get(
            Uri.parse('${AppConfig.backendUrl}/api/alerts/active'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);
        return jsonData.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Failed to fetch alerts: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Alerts fetch error: $e');
      throw Exception('Connection error: $e');
    }
  }
}
