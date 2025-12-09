import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sensor_provider.dart';
import '../widgets/sensor_card.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/status_indicator.dart';
import '../l10n/translations.dart';
import 'crop_confirmation_screen.dart'; // ✅ Critical Import
import 'irrigation_advice_screen.dart';
import 'api_test_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String language;
  final Function(String) onLanguageChange;

  const DashboardScreen({
    super.key,
    required this.language,
    required this.onLanguageChange,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _t(String key) => AppTranslations.translate(key, widget.language);

  @override
  void initState() {
    super.initState();
    // Auto-fetch on screen load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<SensorProvider>(context, listen: false).fetchData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SensorProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          appBar: AppBar(
            title: Text(_t('appTitle'),
                style: const TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: const Color(0xFF4CAF50),
            foregroundColor: Colors.white,
            elevation: 2,
            actions: [
              // Test API Debug Button
              IconButton(
                icon: const Icon(Icons.bug_report),
                tooltip: 'Test API',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => ApiTestScreen()),
                  );
                },
              ),

              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: StatusIndicator(
                    isConnected: provider.isWebSocketConnected,
                    label: provider.isWebSocketConnected
                        ? _t('realtime')
                        : _t('offline'),
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
                          const Icon(Icons.cloud_off,
                              size: 80, color: Colors.red),
                          const SizedBox(height: 20),
                          Text(_t('error')),
                          Text(provider.errorMessage,
                              textAlign: TextAlign.center),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: () => provider.fetchData(),
                            child: Text(_t('retry')),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        await provider.fetchData();
                      },
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          DashboardHeader(
                            title: _t('dashboard'),
                            subtitle:
                                '${_t('lastUpdated')}: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                          ),
                          const SizedBox(height: 12),

                          // Manual Refresh Button
                          ElevatedButton.icon(
                            onPressed: () async {
                              await provider.fetchData();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(widget.language == 'hi'
                                      ? 'डेटा अपडेट किया गया!'
                                      : 'Data refreshed!'),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            },
                            icon: const Icon(Icons.refresh),
                            label: Text(
                              widget.language == 'hi'
                                  ? 'डेटा रिफ्रेश करें'
                                  : 'Refresh Data',
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(double.infinity, 50),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),

                          const SizedBox(height: 20),

                          if (provider.sensors.isEmpty)
                            Center(
                              child: Column(
                                children: [
                                  const SizedBox(height: 40),
                                  const Icon(Icons.sensors_off,
                                      size: 80, color: Colors.grey),
                                  const SizedBox(height: 20),
                                  Text(
                                    _t('noData'),
                                    style: const TextStyle(
                                        fontSize: 18, color: Colors.grey),
                                  ),
                                  const SizedBox(height: 20),
                                  Text(
                                    widget.language == 'hi'
                                        ? 'ऊपर "डेटा रिफ्रेश करें" बटन दबाएं'
                                        : 'Press "Refresh Data" button above',
                                    style: const TextStyle(
                                        fontSize: 14, color: Colors.grey),
                                  ),
                                ],
                              ),
                            )
                          else
                            ...provider.sensors.map((sensor) {
                              return Column(
                                children: [
                                  SensorCard(
                                      sensor: sensor,
                                      language: widget.language),
                                  const SizedBox(height: 12),
                                  _buildActionButtons(sensor),
                                  const SizedBox(height: 20),
                                ],
                              );
                            }),
                        ],
                      ),
                    ),
        );
      },
    );
  }

  Widget _buildActionButtons(dynamic sensor) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CropConfirmationScreen(
                            sensorData: sensor,
                            language: widget.language,
                          ),
                        ),
                      );

                      // Refresh data if crop confirmed
                      if (result == true) {
                        Provider.of<SensorProvider>(context, listen: false)
                            .fetchData();
                      }
                    },
                    icon: const Icon(Icons.agriculture, size: 20),
                    label: Text(
                      widget.language == 'hi' ? 'फसल पुष्टि' : 'Confirm Crop',
                      style: const TextStyle(fontSize: 14),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4CAF50),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => IrrigationAdviceScreen(
                            fieldId: sensor.nodeId,
                            language: widget.language,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.water_drop, size: 20),
                    label: Text(
                      widget.language == 'hi' ? 'सिंचाई सलाह' : 'Irrigation',
                      style: const TextStyle(fontSize: 14),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2196F3),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Quick info text
            Text(
              widget.language == 'hi'
                  ? 'पहले फसल की पुष्टि करें, फिर सिंचाई सलाह देखें'
                  : 'Confirm crop first, then check irrigation advice',
              style: const TextStyle(
                fontSize: 11,
                color: Colors.black54,
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
