import 'dart:convert';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';
import '../config/app_config.dart';

class MqttService {
  late MqttServerClient client;
  
  // callback now accepts (nodeId, payload)
  final Function(int, Map<String, dynamic>) onMessageReceived;
  final Function(bool) onStatusChange; // New: notify provider of connection status

  bool _isConnected = false;

  MqttService({
    required this.onMessageReceived,
    required this.onStatusChange,
  });

  bool get isConnected => _isConnected;

  Future<bool> connect() async {
    final host = AppConfig.mqttBroker;
    final port = AppConfig.mqttPort;

    // Use a unique client ID to prevent broker conflicts
    client = MqttServerClient(
      host,
      'flutter_app_${DateTime.now().millisecondsSinceEpoch}',
    );

    client.port = port;
    client.keepAlivePeriod = 60;
    client.logging(on: false);
    client.autoReconnect = true;
    client.onDisconnected = _onDisconnected;
    client.onConnected = _onConnected;

    final connMessage = MqttConnectMessage()
        .withClientIdentifier('flutter_client_${DateTime.now().millisecondsSinceEpoch}')
        .startClean() // Clean session ensures we don't get stale messages
        .withWillQos(MqttQos.atLeastOnce);

    client.connectionMessage = connMessage;

    try {
      print('🔌 Connecting to MQTT: $host:$port');
      await client.connect();
    } catch (e) {
      print('❌ MQTT connection error: $e');
      client.disconnect();
      _isConnected = false;
      onStatusChange(false);
      return false;
    }

    if (client.connectionStatus?.state == MqttConnectionState.connected) {
      print('✅ MQTT connected');
      _isConnected = true;
      onStatusChange(true);

      // Phase 4: Subscribe to wildcard topic for all sensors
      // Matches: wusn/sensor/1/data, wusn/sensor/2/data, etc.
      const topic = 'wusn/sensor/+/data';
      client.subscribe(topic, MqttQos.atLeastOnce);
      print('📡 Subscribed to: $topic');

      // Listen for messages
      client.updates?.listen((List<MqttReceivedMessage<MqttMessage>> messages) {
        final recMess = messages.first.payload as MqttPublishMessage;
        final topic = messages.first.topic; // e.g., "wusn/sensor/1/data"
        final payload = MqttPublishPayload.bytesToStringAsString(recMess.payload.message);

        try {
          final data = jsonDecode(payload) as Map<String, dynamic>;
          
          // Extract nodeId from topic
          // Split "wusn/sensor/1/data" -> ["wusn", "sensor", "1", "data"]
          final parts = topic.split('/');
          int nodeId = 0;
          if (parts.length >= 3) {
             nodeId = int.tryParse(parts[2]) ?? 0;
          }

          // If nodeId wasn't in topic, check payload, else default to 0
          if (nodeId == 0 && data.containsKey('nodeId')) {
            nodeId = data['nodeId'];
          }

          if (nodeId != 0) {
            print('📨 MQTT Update for Node $nodeId');
            onMessageReceived(nodeId, data);
          }
        } catch (e) {
          print('❌ Error parsing MQTT payload: $e');
        }
      });

      return true;
    } else {
      print('❌ MQTT connection failed: ${client.connectionStatus}');
      _isConnected = false;
      onStatusChange(false);
      return false;
    }
  }

  void _onConnected() {
    print('✅ MQTT Connected callback');
    _isConnected = true;
    onStatusChange(true);
  }

  void _onDisconnected() {
    print('❌ MQTT Disconnected');
    _isConnected = false;
    onStatusChange(false);
  }

  void disconnect() {
    if (client.connectionStatus?.state == MqttConnectionState.connected) {
      client.disconnect();
      _isConnected = false;
      onStatusChange(false);
      print('👋 MQTT Disconnected gracefully');
    }
  }

  /// Reconnect to MQTT broker
  Future<bool> reconnect() async {
    disconnect();
    await Future.delayed(const Duration(seconds: 2));
    return await connect();
  }
}
