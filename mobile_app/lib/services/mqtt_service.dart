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
    // Broker host/port from AppConfig (which reads from .env)
    final host = AppConfig.mqttBroker;
    final port = AppConfig.mqttPort;

    client = MqttServerClient(
      host,
      'flutter_${DateTime.now().millisecondsSinceEpoch}',
    );

    client.port = port;
    client.keepAlivePeriod = 60;
    client.logging(on: false);
    client.autoReconnect = true;
    client.onDisconnected = _onDisconnected;

    final connMessage = MqttConnectMessage()
        .withClientIdentifier('flutter_app_${DateTime.now().millisecondsSinceEpoch}')
        .startClean()
        .withWillQos(MqttQos.atLeastOnce);

    client.connectionMessage = connMessage;

    try {
      print('Connecting to MQTT: $host:$port');
      await client.connect();
    } catch (e) {
      print('MQTT connection error: $e');
      client.disconnect();
      _isConnected = false;
      return false;
    }

    if (client.connectionStatus?.state == MqttConnectionState.connected) {
      print('MQTT connected');
      _isConnected = true;

      const topic = 'wusn/dashboard/updates';
      client.subscribe(topic, MqttQos.atLeastOnce);
      print('Subscribed to: $topic');

      client.updates?.listen((List<MqttReceivedMessage<MqttMessage>> messages) {
        final recMess = messages.first.payload as MqttPublishMessage;
        final payload =
            MqttPublishPayload.bytesToStringAsString(recMess.payload.message);

        try {
          final data = jsonDecode(payload) as Map<String, dynamic>;
          onMessageReceived(data);
        } catch (e) {
          print('Error parsing MQTT payload: $e');
        }
      });

      return true;
    } else {
      print('MQTT connection failed: ${client.connectionStatus}');
      _isConnected = false;
      return false;
    }
  }

  void _onDisconnected() {
    print('MQTT disconnected');
    _isConnected = false;
  }

  void disconnect() {
    if (client.connectionStatus?.state == MqttConnectionState.connected) {
      client.disconnect();
      _isConnected = false;
    }
  }
}
