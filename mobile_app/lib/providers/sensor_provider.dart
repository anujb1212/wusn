import 'package:flutter/foundation.dart';
import 'dart:async';
import '../services/api_service.dart';
import '../models/sensor_data.dart';

class SensorProvider with ChangeNotifier {
  List<SensorData> _sensors = [];
  bool _isLoading = false;
  String _errorMessage = '';
  bool _isWebSocketConnected = false;
  Timer? _refreshTimer;

  List<SensorData> get sensors => _sensors;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isWebSocketConnected => _isWebSocketConnected;

  SensorProvider() {
    // Auto-fetch on init
    fetchData();
    
    // Auto-refresh every 15 seconds
    _refreshTimer = Timer.periodic(Duration(seconds: 60), (timer) {
      fetchData();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> fetchData() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      print('🔍 [Provider] Fetching sensor data...');
      
      // Get all nodes first
      final nodes = await ApiService.getAllNodes();
      print('✅ [Provider] Got ${nodes.length} nodes');

      List<SensorData> sensorDataList = [];

      for (var node in nodes) {
        final nodeId = node['nodeId'] as int;
        
        try {
          // Get latest reading for this node
          final readings = await ApiService.getNodeReadings(nodeId, limit: 1);
          
          if (readings.isEmpty) {
            print('⚠️ No readings for node $nodeId');
            continue;
          }

          final latestReading = readings[0];
          
          // Get crop recommendation
          Map<String, dynamic>? cropData;
          try {
            cropData = await ApiService.getCropRecommendations(nodeId);
            print('✅ Crop for node $nodeId: ${cropData['bestCrop']}');
          } catch (e) {
            print('⚠️ Crop rec failed for node $nodeId: $e');
          }

          // Get irrigation advice
          Map<String, dynamic>? irrigationData;
          try {
            irrigationData = await ApiService.getIrrigationRecommendation(nodeId);
            print('✅ Irrigation for node $nodeId: ${irrigationData['reason']}');
          } catch (e) {
            print('⚠️ Irrigation failed for node $nodeId: $e');
          }

          // Determine soil status from urgency
          String soilStatus = 'optimal';
          if (irrigationData != null) {
            final urgency = irrigationData['urgency'] ?? 'LOW';
            if (urgency == 'CRITICAL' || urgency == 'HIGH') {
              soilStatus = 'dry';
            } else if (urgency == 'LOW') {
              soilStatus = 'optimal';
            } else {
              soilStatus = 'wet';
            }
          }

          // Build SensorData object
          final sensorData = SensorData.fromJson({
            'nodeId': nodeId,
            'moisture': latestReading['moisture'] ?? 0,
            'temperature': latestReading['temperature'] ?? 0,
            'rssi': latestReading['rssi'] ?? -100,
            'timestamp': latestReading['timestamp'] ?? DateTime.now().toIso8601String(),
            
            // Crop data
            'bestCrop': cropData?['bestCrop'] ?? 'unknown',
            'cropConfidence': (cropData?['confidence'] ?? 0).toDouble(),
            'summary': cropData?['summary'] ?? 'Data being analyzed...',
            'alternativeCrops': (cropData?['topCrops'] as List?)
                ?.skip(1)
                .take(2)
                .map((crop) => {
                      'cropName': crop['cropName'],
                      'suitability': (crop['suitability'] as num).toDouble(),
                      'reason': crop['reason'],
                    })
                .toList() ?? [],
            
            // Irrigation data
            'soilStatus': soilStatus,
            'irrigationAdvice': irrigationData?['reason'] ?? 'Processing...',
            'confidence': ((irrigationData?['confidence'] ?? 0.0) as num).toDouble() * 100,
            
            // Fuzzy scores (dummy values)
            'fuzzyScores': {
              'dry': soilStatus == 'dry' ? 0.8 : 0.2,
              'optimal': soilStatus == 'optimal' ? 0.8 : 0.2,
              'wet': soilStatus == 'wet' ? 0.8 : 0.2,
            },
          });

          sensorDataList.add(sensorData);
          
        } catch (e) {
          print('❌ Error processing node $nodeId: $e');
        }
      }

      _sensors = sensorDataList;
      _isLoading = false;
      _errorMessage = '';
      _isWebSocketConnected = true; // Set connected when data fetched successfully
      
      print('✅ [Provider] Successfully loaded ${_sensors.length} sensors');
      
    } catch (e) {
      print('❌ [Provider] Fetch error: $e');
      _errorMessage = e.toString();
      _isLoading = false;
      _isWebSocketConnected = false;
    }

    notifyListeners();
  }

  void updateWebSocketStatus(bool connected) {
    _isWebSocketConnected = connected;
    notifyListeners();
  }
}
