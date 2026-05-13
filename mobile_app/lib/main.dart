import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/dashboard_screen.dart';
import 'providers/sensor_provider.dart';
import 'services/mqtt_service.dart';
import 'package:intl/date_symbol_data_local.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await initializeDateFormatting('hi', null);
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

    _sensorProvider = SensorProvider();

    _loadSavedLanguage();

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

    _mqttService.connect();
  }

  Future<void> _loadSavedLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('app_language');
    if (!mounted) return;
    if (saved == null || (saved != 'en' && saved != 'hi')) {
      return;
    }
    setState(() {
      _language = saved;
    });
  }

  @override
  void dispose() {
    _disposed = true;

    _mqttService.disconnect();

    _sensorProvider.dispose();

    super.dispose();
  }

  void _changeLanguage(String lang) {
    setState(() {
      _language = lang;
    });
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('app_language', lang);
    });
  }

  @override
  Widget build(BuildContext context) {
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
