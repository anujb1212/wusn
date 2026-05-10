import 'package:flutter/material.dart';
import 'package:mobile_app/screens/add_node_to_field_screen.dart';
import 'package:mobile_app/services/api_service.dart';
import 'package:provider/provider.dart';

import '../providers/sensor_provider.dart';
import '../widgets/sensor_card.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/status_indicator.dart';
import '../l10n/translations.dart';

import '../models/sensor_data.dart';

import 'node_setup_screen.dart';
import 'crop_confirmation_screen.dart';
import 'irrigation_advice_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String language;
  final ValueChanged<String> onLanguageChange;

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

    // Auto-fetch on screen load (safe even if provider constructor also fetches).
    // Use mounted guard for safety in rare fast-dispose cases.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Provider.of<SensorProvider>(context, listen: false).fetchData();
    });
  }

  bool _fabOpen = false;

  Widget _buildSpeedDial() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (_fabOpen) ...[
          // Option 1 — Add Field (naya field + naya node)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: const [
                    BoxShadow(color: Colors.black26, blurRadius: 4)
                  ],
                ),
                child: Text(
                  widget.language == 'hi' ? 'नया खेत जोड़ें' : 'Add New Field',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 8),
              FloatingActionButton.small(
                heroTag: 'fab_field',
                onPressed: () async {
                  setState(() => _fabOpen = false);
                  final navigator = Navigator.of(context);
                  final provider =
                      Provider.of<SensorProvider>(context, listen: false);
                  await navigator.push(MaterialPageRoute(
                      builder: (_) => const NodeSetupScreen()));
                  if (!mounted) return;
                  provider.fetchData();
                },
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                child: const Icon(Icons.add_location_alt),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Option 2 — Add Node to existing field
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: const [
                    BoxShadow(color: Colors.black26, blurRadius: 4)
                  ],
                ),
                child: Text(
                  widget.language == 'hi'
                      ? 'खेत में नोड जोड़ें'
                      : 'Add Node to Field',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 8),
              FloatingActionButton.small(
                heroTag: 'fab_node',
                onPressed: () async {
                  setState(() => _fabOpen = false);
                  final navigator = Navigator.of(context);
                  final provider =
                      Provider.of<SensorProvider>(context, listen: false);
                  await navigator.push(MaterialPageRoute(
                      builder: (_) => const AddNodeToFieldScreen()));
                  if (!mounted) return;
                  provider.fetchData();
                },
                backgroundColor: const Color(0xFF2196F3),
                foregroundColor: Colors.white,
                child: const Icon(Icons.sensors),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
        // Main FAB
        FloatingActionButton(
          heroTag: 'fab_main',
          onPressed: () => setState(() => _fabOpen = !_fabOpen),
          backgroundColor: const Color(0xFF4CAF50),
          foregroundColor: Colors.white,
          child: AnimatedRotation(
            turns: _fabOpen ? 0.125 : 0,
            duration: const Duration(milliseconds: 200),
            child: const Icon(Icons.add, size: 28),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SensorProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          appBar: AppBar(
            title: Text(
              _t('appTitle'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            backgroundColor: const Color(0xFF4CAF50),
            foregroundColor: Colors.white,
            elevation: 2,
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: StatusIndicator(
                    isConnected: provider.isWebSocketConnected,
                    label: provider.isWebSocketConnected ? 'Live' : 'Polling',
                  ),
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.language, size: 28),
                onSelected: widget.onLanguageChange,
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'en', child: Text('English')),
                  PopupMenuItem(value: 'hi', child: Text('हिंदी')),
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
                            subtitle: provider.lastFetchedAt != null
                                ? '${_t('lastUpdated')}: ${_formatFetchTime(provider.lastFetchedAt!)}'
                                : _t('loading'),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: () async {
                              final prov = Provider.of<SensorProvider>(context,
                                  listen: false);
                              await prov.fetchData();
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
                                  const SizedBox(height: 24),
                                  ElevatedButton.icon(
                                    onPressed: () async {
                                      await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) =>
                                                const NodeSetupScreen()),
                                      );
                                      if (!context.mounted) return;
                                      Provider.of<SensorProvider>(context,
                                              listen: false)
                                          .fetchData();
                                    },
                                    icon: const Icon(Icons.add),
                                    label: const Text('Add Sensor Node'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF4CAF50),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 24, vertical: 14),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12)),
                                    ),
                                  ),
                                ],
                              ),
                            )
                          else
                            ...provider.sensors.map((SensorData sensor) {
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
          floatingActionButton: _buildSpeedDial(),
        );
      },
    );
  }

  Widget _buildHarvestButton(SensorData sensor) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _showHarvestDialog(sensor),
        icon: const Icon(Icons.agriculture, color: Colors.brown),
        label: Text(
          widget.language == 'hi'
              ? '🌾 फसल काटी — नई फसल बोएं'
              : '🌾 Mark Harvested — Sow New Crop',
          style: const TextStyle(
            color: Colors.brown,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.brown, width: 1.5),
          padding: const EdgeInsets.symmetric(vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }

  Future<void> _showHarvestDialog(SensorData sensor) async {
    final daysToHarvest = sensor.estimatedDaysToHarvest;
    final isEarly = daysToHarvest != null && daysToHarvest > 7;
    final daysRounded = daysToHarvest?.round() ?? 0;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(children: [
          const Text('🌾 '),
          Text(widget.language == 'hi' ? 'फसल काटी?' : 'Harvest Complete?'),
        ]),
        content: Text(
          widget.language == 'hi'
              ? isEarly
                  ? '⚠️ अभी $daysRounded दिन बाकी हैं!\n\n${sensor.cropType.toUpperCase()} की फसल समय से पहले काट रहे हैं?\nपैदावार कम हो सकती है।'
                  : '${sensor.cropType.toUpperCase()} की फसल काट ली?\nनई फसल बोने के लिए आगे बढ़ें।'
              : isEarly
                  ? '⚠️ $daysRounded days still remaining!\n\nHarvesting ${sensor.cropType.toUpperCase()} early?\nYield may be reduced.'
                  : '${sensor.cropType.toUpperCase()} harvested?\nProceed to sow a new crop.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(widget.language == 'hi' ? 'नहीं' : 'Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: isEarly ? Colors.orange : Colors.brown,
            ),
            child: Text(
              widget.language == 'hi'
                  ? isEarly
                      ? 'फिर भी काटें'
                      : 'हाँ, नई फसल बोएं'
                  : isEarly
                      ? 'Harvest Anyway'
                      : 'Yes, Sow New Crop',
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await ApiService.harvestCrop(nodeId: sensor.nodeId);

      if (!mounted) return;

      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => CropConfirmationScreen(
            sensorData: sensor,
            language: widget.language,
            isAlreadyConfirmed: false,
            isHarvestReset: true,
            confirmedSowingDate: null,
          ),
        ),
      );

      if (result == true && mounted) {
        Provider.of<SensorProvider>(context, listen: false).fetchData();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.language == 'hi' ? 'त्रुटि: $e' : 'Error: $e',
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildHarvestDateChip(SensorData sensor) {
    final daysToHarvest = sensor.estimatedDaysToHarvest ?? 0;
    final days = daysToHarvest.round();
    final isNearHarvest = days <= 7;
    final harvestDate = DateTime.now().add(Duration(days: days));
    final dateStr =
        '${harvestDate.day}/${harvestDate.month}/${harvestDate.year}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isNearHarvest ? Colors.amber.shade50 : Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isNearHarvest ? Colors.amber.shade300 : Colors.green.shade200,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isNearHarvest ? Icons.warning_amber : Icons.calendar_today,
            size: 16,
            color:
                isNearHarvest ? Colors.amber.shade700 : Colors.green.shade700,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              widget.language == 'hi'
                  ? isNearHarvest
                      ? '🌾 फसल तैयार! अनुमानित $days दिन बचे ($dateStr)'
                      : '📅 अनुमानित कटाई: $days दिन बाद ($dateStr)'
                  : isNearHarvest
                      ? '🌾 Harvest ready! ~$days days left ($dateStr)'
                      : '📅 Est. harvest in $days days ($dateStr)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isNearHarvest
                    ? Colors.amber.shade800
                    : Colors.green.shade800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(SensorData sensor) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            // Harvest date indicator
            if (sensor.cropType.isNotEmpty &&
                sensor.estimatedDaysToHarvest != null &&
                sensor.estimatedDaysToHarvest! > 0)
              _buildHarvestDateChip(sensor),
            if (sensor.cropType.isNotEmpty &&
                sensor.estimatedDaysToHarvest != null &&
                sensor.estimatedDaysToHarvest! > 0)
              const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: sensor.cropType.isNotEmpty
                        ? () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  widget.language == 'hi'
                                      ? '🔒 फसल पहले से बोई जा चुकी है: ${sensor.cropType.toUpperCase()}'
                                      : '🔒 Crop already sown: ${sensor.cropType.toUpperCase()}',
                                ),
                                backgroundColor: Colors.orange,
                                duration: const Duration(seconds: 3),
                              ),
                            );
                          }
                        : () async {
                            final prov = Provider.of<SensorProvider>(context,
                                listen: false);
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => CropConfirmationScreen(
                                  sensorData: sensor,
                                  language: widget.language,
                                  isAlreadyConfirmed: false,
                                  confirmedSowingDate: null,
                                ),
                              ),
                            );
                            if (result == true) {
                              prov.fetchData();
                            }
                          },
                    icon: Icon(
                      sensor.cropType.isNotEmpty
                          ? Icons.lock
                          : Icons.agriculture,
                      size: 20,
                    ),
                    label: Text(
                      sensor.cropType.isNotEmpty
                          ? (widget.language == 'hi'
                              ? 'फसल बोई गई 🔒'
                              : 'Crop Sown 🔒')
                          : (widget.language == 'hi'
                              ? 'फसल पुष्टि'
                              : 'Confirm Crop'),
                      style: const TextStyle(fontSize: 14),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: sensor.cropType.isNotEmpty
                          ? Colors.grey.shade400
                          : const Color(0xFF4CAF50),
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
                            fieldId: sensor.nodeId, // nodeId
                            language: widget.language,
                            lastSensorTimestamp: sensor.timestamp,
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
            // Harvest button
            if (sensor.cropType.isNotEmpty) _buildHarvestButton(sensor),
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

  String _formatFetchTime(DateTime dt) {
    final local = dt.toLocal();
    final h = local.hour.toString();
    final m = local.minute.toString().padLeft(2, '0');
    final s = local.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }
}
