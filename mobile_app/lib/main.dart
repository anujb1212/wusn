import 'package:flutter/material.dart';

void main() => runApp(MyApp());

class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _language = 'hi'; // Start with Hindi for farmers

  void _changeLanguage(String lang) {
    setState(() {
      _language = lang;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        primaryColor: const Color(0xFF4CAF50),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4CAF50),
        ),
        useMaterial3: true,
      ),
      home: FarmerDashboard(
        language: _language,
        onLanguageChange: _changeLanguage,
      ),
    );
  }
}

class FarmerDashboard extends StatefulWidget {
  final String language;
  final Function(String) onLanguageChange;

  const FarmerDashboard({
    required this.language,
    required this.onLanguageChange,
  });

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  List<Map<String, dynamic>> nodes = [
    {'id': 1, 'moisture': 650, 'temperature': 28},
    {'id': 2, 'moisture': 450, 'temperature': 30},
    {'id': 3, 'moisture': 550, 'temperature': 27},
    {'id': 4, 'moisture': 750, 'temperature': 29},
  ];

  // Farmer-friendly translations
  Map<String, Map<String, String>> _translations = {
    'en': {
      'appTitle': 'Soil Monitor',
      'dashboard': 'Dashboard',
      'node': 'Sensor',
      'moisture': 'Soil Water',
      'temperature': 'Temperature',
      'goodCondition': 'All Good',
      'needsWater': 'Needs Water',
      'tooWet': 'Too Wet',
      'recommendations': 'What To Do',
      'waterNow': '👉 Give water now. Soil is dry.',
      'dontWater': '👉 Don\'t water today. Soil has enough moisture.',
      'checkDrainage': '👉 Check drainage. Too much water.',
      'lastUpdated': 'Last Checked',
    },
    'hi': {
      'appTitle': 'खेत की नमी',
      'dashboard': 'मुख्य पेज',
      'node': 'सेंसर',
      'moisture': 'मिट्टी में पानी',
      'temperature': 'गर्मी',
      'goodCondition': 'सब ठीक है',
      'needsWater': 'पानी चाहिए',
      'tooWet': 'ज्यादा गीला',
      'recommendations': 'क्या करें',
      'waterNow': '👉 अभी पानी दें। मिट्टी सूखी है।',
      'dontWater': '👉 आज पानी मत दें। मिट्टी में काफी नमी है।',
      'checkDrainage': '👉 पानी निकलने की जाँच करें। बहुत गीला है।',
      'lastUpdated': 'आखरी बार देखा',
    },
  };

  String _t(String key) {
    return _translations[widget.language]?[key] ?? key;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(_t('appTitle'), style: const TextStyle(fontSize: 22)),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.language, size: 28),
            onSelected: widget.onLanguageChange,
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'en', child: Text('English', style: TextStyle(fontSize: 18))),
              const PopupMenuItem(value: 'hi', child: Text('हिंदी', style: TextStyle(fontSize: 18))),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            ...nodes.map((node) => _buildNodeCard(context, node)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(Icons.eco, size: 60, color: Color(0xFF4CAF50)),
            const SizedBox(height: 10),
            Text(
              _t('dashboard'),
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '${_t('lastUpdated')}: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
              style: const TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNodeCard(BuildContext context, Map<String, dynamic> node) {
    int moisture = node['moisture'];
    int temperature = node['temperature'];

    String status;
    String recommendation;
    Color statusColor;
    IconData statusIcon;

    if (moisture < 500) {
      status = _t('needsWater');
      recommendation = _t('waterNow');
      statusColor = Colors.red;
      statusIcon = Icons.water_drop_outlined;
    } else if (moisture > 700) {
      status = _t('tooWet');
      recommendation = _t('checkDrainage');
      statusColor = Colors.orange;
      statusIcon = Icons.warning_amber;
    } else {
      status = _t('goodCondition');
      recommendation = _t('dontWater');
      statusColor = Colors.green;
      statusIcon = Icons.check_circle;
    }

    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_t('node')} ${node['id']}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(statusIcon, color: statusColor, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        status,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 30, thickness: 1),
            _buildDataRow(Icons.water_drop, _t('moisture'), '$moisture', Colors.blue),
            const SizedBox(height: 16),
            _buildDataRow(Icons.thermostat, _t('temperature'), '${temperature}°C', Colors.orange),
            const Divider(height: 30, thickness: 1),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb, color: Color(0xFF4CAF50), size: 24),
                      const SizedBox(width: 10),
                      Text(
                        _t('recommendations'),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    recommendation,
                    style: const TextStyle(fontSize: 16, height: 1.4),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 32),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Future<void> _refreshData() async {
    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      nodes = nodes.map((node) {
        return {
          ...node,
          'moisture': node['moisture'] + (DateTime.now().second % 10 - 5),
        };
      }).toList();
    });
  }
}
