import 'dart:convert';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';
import '../config/app_config.dart';

class MqttService {
  late MqttServerClient client;
  final Function(Map<String, dynamic>) onMessageReceived;
  bool _isConnected = false;

  MqttService({required this.onMessageReceived});

  bool get isConnected => _isConnected;

  Future<bool> connect() async {
    client = MqttServerClient(AppConfig.mqttBroker, 'flutter_${DateTime.now().millisecondsSinceEpoch}');
    client.port = AppConfig.mqttPort;
    client.keepAlivePeriod = 60;
    client.logging(on: false);
    client.autoReconnect = true;

    final connMessage = MqttConnectMessage()
        .withClientIdentifier('flutter_app')
        .startClean()
        .withWillQos(MqttQos.atLeastOnce);
    
    client.connectionMessage = connMessage;

    try {
      print('Connecting to MQTT: ${AppConfig.mqttBroker}:${AppConfig.mqttPort}');
      await client.connect();
    } catch (e) {
      print('MQTT connection error: $e');
      client.disconnect();
      _isConnected = false;
      return false;
    }

    if (client.connectionStatus!.state == MqttConnectionState.connected) {
      print('MQTT connected');
      _isConnected = true;
      
      const topic = 'wusn/dashboard/updates';
      client.subscribe(topic, MqttQos.atLeastOnce);
      print('Subscribed to: $topic');
      
      client.updates!.listen((List<MqttReceivedMessage<MqttMessage>> messages) {
        final message = messages[0].payload as MqttPublishMessage;
        final payload = MqttPublishPayload.bytesToStringAsString(message.payload.message);
        
        try {
          final data = jsonDecode(payload);
          onMessageReceived(data);
        } catch (e) {
          print('Error parsing MQTT: $e');
        }
      });
      
      // Handle disconnection
      client.onDisconnected = () {
        print('MQTT disconnected');
        _isConnected = false;
      };
      
      return true;
    } else {
      print('MQTT connection failed');
      _isConnected = false;
      return false;
    }
  }

  void disconnect() {
    if (client.connectionStatus?.state == MqttConnectionState.connected) {
      client.disconnect();
      _isConnected = false;
    }
  }
}
