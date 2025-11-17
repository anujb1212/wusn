import 'package:flutter/foundation.dart';
import '../models/sensor_data.dart';
import '../services/api_service.dart';
import '../services/mqtt_service.dart';

class SensorProvider extends ChangeNotifier {
  List<SensorData> _sensors = [];
  bool _isLoading = false;
  String _errorMessage = '';
  late MqttService _mqttService;
  bool _isMqttConnected = false;

  List<SensorData> get sensors => _sensors;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isWebSocketConnected => _isMqttConnected;  // Keep name for compatibility

  SensorProvider() {
    _initMqtt();
    fetchData();
  }

  void _initMqtt() async {
    _mqttService = MqttService(
      onMessageReceived: _handleMqttMessage,
    );

    final connected = await _mqttService.connect();
    _isMqttConnected = connected;
    notifyListeners();
  }

  void _handleMqttMessage(Map<String, dynamic> data) {
    try {
      final sensorData = SensorData.fromJson(data);
      
      // Update or add
      final index = _sensors.indexWhere((s) => s.nodeId == sensorData.nodeId);
      if (index != -1) {
        _sensors[index] = sensorData;
      } else {
        _sensors.insert(0, sensorData);
      }
      
      // Sort by nodeId
      _sensors.sort((a, b) => a.nodeId.compareTo(b.nodeId));
      
      // Keep max 20 items
      if (_sensors.length > 20) {
        _sensors = _sensors.sublist(0, 20);
      }
      
      notifyListeners();
    } catch (e) {
      print('Error handling MQTT message: $e');
    }
  }

  Future<void> fetchData() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      _sensors = await ApiService.fetchLatestData();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _mqttService.disconnect();
    super.dispose();
  }
}
