import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'screens/dashboard_screen.dart';
import 'providers/sensor_provider.dart';
import 'services/mqtt_service.dart'; // Added Import

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _language = 'hi';

  // 1. Instantiate Provider here to link it with MQTT
  final SensorProvider _sensorProvider = SensorProvider();
  late MqttService _mqttService;

  @override
  void initState() {
    super.initState();

    // 2. Initialize and Connect MQTT Service
    // We link the Service callbacks directly to the Provider's methods
    _mqttService = MqttService(
      onMessageReceived: (nodeId, data) {
        _sensorProvider.onMqttDataReceived(nodeId, data);
      },
      onStatusChange: (isConnected) {
        _sensorProvider.updateWebSocketStatus(isConnected);
      },
    );

    // Start connection
    _mqttService.connect();
  }

  @override
  void dispose() {
    // 3. Clean up connections
    _mqttService.disconnect();
    super.dispose();
  }

  void _changeLanguage(String lang) {
    setState(() {
      _language = lang;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      // 4. Use .value since we created the instance in initState
      value: _sensorProvider,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Smart Irrigation',
        theme: ThemeData(
          primaryColor: const Color(0xFF4CAF50),
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4CAF50)),
          useMaterial3: true,
        ),
        home: DashboardScreen(
          language: _language,
          onLanguageChange: _changeLanguage,
        ),
      ),
    );
  }
}
