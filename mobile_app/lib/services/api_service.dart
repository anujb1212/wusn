import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/sensor_data.dart';

class ApiService {
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
              'confidence': 0,
              'fuzzyScores': {'dry': 0, 'optimal': 0, 'wet': 0},
              'bestCrop': 'unknown',
              'cropConfidence': 0,
              'alternativeCrops': [],
              'summary': 'Data being analyzed...',
            });
          }
          
          // Get best crop from recommendations
          final crops = analysis['cropRecommendations'] as List<dynamic>?;
          final bestCrop = crops != null && crops.isNotEmpty 
              ? crops[0]['cropName'] 
              : 'unknown';
          final bestCropConf = crops != null && crops.isNotEmpty 
              ? crops[0]['suitability'] 
              : 0;
          final altCrops = crops != null && crops.length > 1
              ? crops.sublist(1, crops.length > 3 ? 3 : crops.length)
              : [];
          
          return SensorData.fromJson({
            'nodeId': reading['nodeId'],
            'moisture': reading['moisture'],
            'temperature': reading['temperature'],
            'rssi': reading['rssi'],
            'timestamp': reading['timestamp'],
            'soilStatus': analysis['soilStatus'],
            'irrigationAdvice': analysis['irrigationAdvice'],
            'confidence': analysis['confidence'],
            'fuzzyScores': {
              'dry': analysis['fuzzyDryScore'],
              'optimal': analysis['fuzzyOptimalScore'],
              'wet': analysis['fuzzyWetScore'],
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
      throw Exception('Connection error: $e');
    }
  }
}
