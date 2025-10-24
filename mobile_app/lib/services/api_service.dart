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
        return jsonData.map((json) => SensorData.fromJson(json)).toList();
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }
}
