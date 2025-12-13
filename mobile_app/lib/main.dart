import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import 'screens/dashboard_screen.dart';
import 'providers/sensor_provider.dart';
import 'services/mqtt_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
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

  late final SensorProvider _sensorProvider;
  late final MqttService _mqttService;

  bool _disposed = false;

  @override
  void initState() {
    super.initState();

    // Keep manual ownership (needed because MqttService needs a stable instance reference).
    _sensorProvider = SensorProvider();

    _mqttService = MqttService(
      onMessageReceived: (nodeId, data) {
        if (_disposed) return;
        _sensorProvider.onMqttDataReceived(nodeId, data);
      },
      onStatusChange: (isConnected) {
        if (_disposed) return;
        _sensorProvider.updateWebSocketStatus(isConnected);
      },
    );

    // Fire-and-forget connect; provider will update connection state via callbacks.
    _mqttService.connect();
  }

  @override
  void dispose() {
    _disposed = true;

    _mqttService.disconnect();

    // This notifier is owned by this State object.
    _sensorProvider
        .dispose(); // ChangeNotifier.dispose should be called by the owner. [web:281]

    super.dispose();
  }

  void _changeLanguage(String lang) {
    setState(() {
      _language = lang;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Using `.value` is correct *only* because we're passing an already-created notifier;
    // Provider will not dispose it, so we dispose manually above. [web:35]
    return ChangeNotifierProvider<SensorProvider>.value(
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
