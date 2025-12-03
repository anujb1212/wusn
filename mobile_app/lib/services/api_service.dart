// lib/services/api_service.dart (COMPLETE UPDATED VERSION)

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/sensor_data.dart';

class ApiService {
  // Helper to normalize crop names (match backend format)
  static String _normalizeCropName(String name) {
    return name.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
  }

  static Future<List<SensorData>> fetchLatestData() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.backendUrl}/api/data/latest'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);
        
        // Parse nested structure from modular backend
        return jsonData.map((item) {
          // Extract data from nested structure
          final reading = item;
          final analysis = item['analysis'];
          
          if (analysis == null) {
            // Fallback if no analysis yet
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
          
          // Get best crop from recommendations
          final crops = analysis['cropRecommendations'] as List<dynamic>?;
          
          // Normalize crop name to match dataset
          final bestCrop = crops != null && crops.isNotEmpty 
              ? _normalizeCropName(crops[0]['cropName']) 
              : 'unknown';
          
          final bestCropConf = crops != null && crops.isNotEmpty 
              ? (crops[0]['suitability'] as num).toDouble() 
              : 0.0;
          
          final altCrops = crops != null && crops.length > 1
              ? crops.sublist(1, crops.length > 3 ? 3 : crops.length).map((crop) => {
                  'cropName': _normalizeCropName(crop['cropName']),
                  'suitability': (crop['suitability'] as num).toDouble(),
                  'reason': crop['reason'] ?? '',
                }).toList()
              : [];
          
          // Debug print
          print('✅ Parsed crop: $bestCrop (confidence: ${bestCropConf.toStringAsFixed(1)}%)');
          
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
            'bestCrop': bestCrop,  // ← Normalized
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

  // Crop confirmation (Phase 2)
  static Future<Map<String, dynamic>> confirmCrop({
    required int fieldId,
    required String cropName,
    required DateTime sowingDate,
    String soilType = 'LOAM',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.backendUrl}/api/crop/confirm'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'fieldId': fieldId,
          'cropName': cropName,
          'sowingDate': sowingDate.toIso8601String().split('T')[0],
          'soilType': soilType,
        }),
      ).timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        print('✅ Crop confirmed: $cropName for field $fieldId');
        return result;
      } else {
        throw Exception('Failed to confirm crop: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Crop confirmation error: $e');
      throw Exception('Connection error: $e');
    }
  }

  // Get irrigation advice (Phase 3)
  static Future<Map<String, dynamic>> getIrrigationAdvice(int fieldId) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.backendUrl}/api/irrigation/check/$fieldId'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        print('✅ Irrigation advice fetched for field $fieldId');
        return result;
      } else {
        final errorBody = json.decode(response.body);
        throw Exception(errorBody['message'] ?? 'Failed to get irrigation advice');
      }
    } catch (e) {
      print('❌ Irrigation advice error: $e');
      throw Exception('Connection error: $e');
    }
  }

  // Get field details
  static Future<Map<String, dynamic>> getFieldDetails(int fieldId) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.backendUrl}/api/field/$fieldId'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(AppConfig.httpTimeout);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get field details: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Field details error: $e');
      throw Exception('Connection error: $e');
    }
  }
}
