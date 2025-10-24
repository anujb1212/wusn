import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get backendUrl => dotenv.env['BACKEND_URL'] ?? 'http://localhost:3000';
  static String get wsUrl => dotenv.env['WS_URL'] ?? 'ws://localhost:3000';
  
  static const String appTitle = 'Soil Monitor';
  static const Duration wsReconnectDelay = Duration(seconds: 5);
  static const Duration httpTimeout = Duration(seconds: 10);
}
