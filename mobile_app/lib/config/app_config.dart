import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  // HTTP backend
  static String get backendUrl =>
      dotenv.env['BACKEND_URL'] ?? 'http://127.0.0.1:3000/api';

  // MQTT broker
  static String get mqttBroker =>
      dotenv.env['MQTT_BROKER'] ?? '127.0.0.1';

  static int get mqttPort =>
      int.tryParse(dotenv.env['MQTT_PORT'] ?? '1883') ?? 1883;

  static const String appTitle = 'Soil Monitor';
  static const Duration httpTimeout = Duration(seconds: 10);
  static const Duration mqttReconnectDelay = Duration(seconds: 5);
}
