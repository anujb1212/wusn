import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  // Note:
  // - Uses flutter_dotenv typed getters with fallback to avoid null issues.
  // - Accepts both MQTT_BROKER (correct) and MQTT_BROCKER (legacy typo) for robustness.

  static String get backendUrl {
    final raw =
        dotenv.get('BACKEND_URL', fallback: 'http://127.0.0.1:3000/api').trim();
    // Normalize to avoid accidental double slashes when building endpoint paths.
    if (raw.endsWith('/')) return raw.substring(0, raw.length - 1);
    return raw;
  }

  static String get mqttBroker {
    final broker = dotenv.maybeGet('MQTT_BROKER')?.trim();
    if (broker != null && broker.isNotEmpty) return broker;

    // // Backward-compatible support for the current .env typo.
    // final legacy = dotenv.maybeGet('MQTT_BROCKER')?.trim();
    // if (legacy != null && legacy.isNotEmpty) return legacy;

    return '127.0.0.1';
  }

  static int get mqttPort => dotenv.getInt('MQTT_PORT', fallback: 1883);

  static const String appTitle = 'Soil Monitor';
  static const Duration httpTimeout = Duration(seconds: 10);
  static const Duration mqttReconnectDelay = Duration(seconds: 5);
}
