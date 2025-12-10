import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiService {
  static const Map<String, String> _headers = {
    'Content-Type': 'application/json'
  };

  static Future<dynamic> _get(String endpoint) async {
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.backendUrl}$endpoint'), headers: _headers)
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    } catch (e) {
      print('❌ API GET Error ($endpoint): $e');
      rethrow;
    }
  }

  static Future<dynamic> _post(
      String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.backendUrl}$endpoint'),
            headers: _headers,
            body: json.encode(body),
          )
          .timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      }
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    } catch (e) {
      print('❌ API POST Error ($endpoint): $e');
      rethrow;
    }
  }

  // Core Methods
  static Future<List<dynamic>> getFields() async {
    final res = await _get('/fields');
    if (res is Map<String, dynamic> && res['data'] is List) {
      return res['data'] as List<dynamic>;
    }
    return res is List ? res : [];
  }

  static Future<Map<String, dynamic>> getLatestSensorData(int nodeId) async {
    final res = await _get('/sensors/$nodeId/latest');

    Map<String, dynamic> data;
    if (res is Map<String, dynamic> && res['data'] != null) {
      data = res['data'] as Map<String, dynamic>;
    } else if (res is Map<String, dynamic>) {
      data = res;
    } else {
      return {};
    }

    return {
      'nodeId': data['nodeId'],
      'moisture': (data['soilMoistureVWC'] ?? 0).toDouble(),
      'temperature': (data['soilTemperature'] ?? 0).toDouble(),
      'timestamp': data['timestamp'],
      'rssi': data['rssi'],
      'batteryLevel': data['batteryLevel'],
    };
  }

  static Future<Map<String, dynamic>> getIrrigationDecision(int nodeId) async {
    final res = await _get('/irrigation/decision/$nodeId');
    if (res is Map<String, dynamic> && res['data'] != null) {
      return res['data'] as Map<String, dynamic>;
    }
    return res is Map<String, dynamic> ? res : {};
  }

  static Future<Map<String, dynamic>> getCropRecommendations(int nodeId) async {
    return await _get('/crops/recommend/$nodeId');
  }

  static Future<Map<String, dynamic>> confirmCrop({
    required int fieldId,
    required String cropName,
    required DateTime sowingDate,
  }) async {
    final formattedDate = sowingDate.toUtc().toIso8601String();

    final body = {
      'cropType': cropName.toLowerCase(),
      'sowingDate': formattedDate,
    };

    print('🌾 Confirming crop: $cropName, date: $formattedDate');

    try {
      final response = await _post('/fields/$fieldId/crop', body);

      if (response['status'] == 'ok') {
        print('✅ Crop confirmed successfully for field $fieldId');
        return {'status': 'ok', 'data': response['data']};
      }

      throw Exception('Unexpected response: $response');
    } catch (e) {
      print('❌ Crop confirmation failed: $e');
      rethrow;
    }
  }

  // ⭐ NEW: Weather Forecast
  static Future<Map<String, dynamic>> getWeatherForecast(int nodeId) async {
    try {
      final res = await _get('/weather/$nodeId/forecast');
      if (res is Map<String, dynamic> && res['data'] != null) {
        return res['data'] as Map<String, dynamic>;
      }
      return res is Map<String, dynamic> ? res : {};
    } catch (e) {
      print('⚠️ Weather forecast unavailable: $e');
      return {};
    }
  }

  // Backward Compatibility
  static Future<Map<String, dynamic>> getIrrigationRecommendation(
      int nodeId) async {
    return getIrrigationDecision(nodeId);
  }

  static Future<List<dynamic>> fetchLatestData() async {
    return [];
  }
}
