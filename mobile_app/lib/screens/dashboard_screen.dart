import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sensor_provider.dart';
import '../widgets/sensor_card.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/status_indicator.dart';
import '../l10n/translations.dart';

class DashboardScreen extends StatefulWidget {
  final String language;
  final Function(String) onLanguageChange;

  const DashboardScreen({
    Key? key,
    required this.language,
    required this.onLanguageChange,
  }) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _t(String key) => AppTranslations.translate(key, widget.language);

  @override
  Widget build(BuildContext context) {
    return Consumer<SensorProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          appBar: AppBar(
            title: Text(_t('appTitle'), style: const TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: const Color(0xFF4CAF50),
            foregroundColor: Colors.white,
            elevation: 2,
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: StatusIndicator(
                    isConnected: provider.isWebSocketConnected,
                    label: provider.isWebSocketConnected ? _t('realtime') : _t('offline'),
                  ),
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.language, size: 28),
                onSelected: widget.onLanguageChange,
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'en', child: Text('English')),
                  const PopupMenuItem(value: 'hi', child: Text('हिंदी')),
                ],
              ),
            ],
          ),
          body: provider.isLoading
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(color: Color(0xFF4CAF50)),
                      const SizedBox(height: 20),
                      Text(_t('loading')),
                    ],
                  ),
                )
              : provider.errorMessage.isNotEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.cloud_off, size: 80, color: Colors.red),
                          const SizedBox(height: 20),
                          Text(_t('error')),
                          Text(provider.errorMessage),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: () => provider.fetchData(),
                            child: Text(_t('retry')),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => provider.fetchData(),
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          DashboardHeader(
                            title: _t('dashboard'),
                            subtitle: '${_t('lastUpdated')}: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                          ),
                          const SizedBox(height: 20),
                          if (provider.sensors.isEmpty)
                            Center(child: Text(_t('noData')))
                          else
                            ...provider.sensors.map(
                              (sensor) => SensorCard(sensor: sensor, language: widget.language),
                            ),
                        ],
                      ),
                    ),
        );
      },
    );
  }
}
