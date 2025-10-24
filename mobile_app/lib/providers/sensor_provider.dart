import 'package:flutter/foundation.dart';
import '../models/sensor_data.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class SensorProvider extends ChangeNotifier {
  List<SensorData> _sensors = [];
  bool _isLoading = false;
  String _errorMessage = '';
  final WebSocketService _wsService = WebSocketService();

  List<SensorData> get sensors => _sensors;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isWebSocketConnected => _wsService.isConnected;

  SensorProvider() {
    _initWebSocket();
    fetchData();
  }

  void _initWebSocket() {
    _wsService.connect();
    _wsService.stream.listen((sensorData) {
      _updateSensorData(sensorData);
    });
  }

  void _updateSensorData(SensorData newData) {
    final index = _sensors.indexWhere((sensor) => sensor.id == newData.id);
    if (index != -1) {
      _sensors[index] = newData;
    } else {
      _sensors.add(newData);
    }
    _sensors.sort((a, b) => a.id.compareTo(b.id));
    notifyListeners();
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
    _wsService.dispose();
    super.dispose();
  }
}
