import 'package:flutter/material.dart';

import '../models/sensor_data.dart';
import '../l10n/translations.dart';

class SensorCard extends StatelessWidget {
  final SensorData sensor;
  final String language;

  const SensorCard({
    super.key,
    required this.sensor,
    required this.language,
  });

  String _t(String key) => AppTranslations.translate(key, language);

  bool get _isHindi => language == 'hi';

  /// Normalize multiple backend/app variants into the translation keys
  /// used by the UI (`needsWater`, `tooWet`, `goodCondition`, `unknown`).
  String _statusKey(String raw) {
    final s = raw.trim();

    switch (s) {
      // Dry / needs water
      case 'needsWater':
      case 'needs_water':
      case 'needs-water':
      case 'dry':
      case 'NEEDS_WATER':
        return 'needsWater';

      // Too wet
      case 'tooWet':
      case 'too_wet':
      case 'too-wet':
      case 'wet':
      case 'TOO_WET':
        return 'tooWet';

      // Optimal / good
      case 'goodCondition':
      case 'optimal':
      case 'ok':
      case 'OPTIMAL':
        return 'goodCondition';

      default:
        return 'unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusKey = _statusKey(sensor.status);

    Color statusColor;
    IconData statusIcon;

    switch (statusKey) {
      case 'needsWater':
        statusColor = Colors.red;
        statusIcon = Icons.water_drop_outlined;
        break;
      case 'tooWet':
        statusColor = Colors.orange;
        statusIcon = Icons.warning_amber;
        break;
      case 'goodCondition':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help_outline;
    }

    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildMainHeader(statusColor, statusIcon, statusKey),
            const Divider(height: 32, thickness: 1),
            _buildSensorReadings(),
            const SizedBox(height: 14),
            _buildRangesIfAvailable(context),
            const Divider(height: 32, thickness: 1),
            _buildFuzzyAnalysis(),
            const Divider(height: 32, thickness: 1),
            _buildCropRecommendation(),
            if (sensor.alternativeCrops.isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildAlternativeCrops(),
            ],
            const SizedBox(height: 16),
            _buildIrrigationAdvice(),
            const SizedBox(height: 16),
            _buildTimestamp(),
          ],
        ),
      ),
    );
  }

  Widget _buildMainHeader(
      Color statusColor, IconData statusIcon, String statusKey) {
    final title = sensor.fieldName.isNotEmpty
        ? sensor.fieldName
        : '${_t('node')} ${sensor.nodeId}';

    final cropLabel = (sensor.bestCrop.trim().isEmpty) ? '-' : sensor.bestCrop;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              title,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.memory, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 6),
                Text(
                  '${_t('node')} ${sensor.nodeId}',
                  style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.agriculture, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${_t('crop')}: $cropLabel',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                  ),
                ),
              ],
            ),
          ]),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.15),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: statusColor.withOpacity(0.3), width: 1.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(statusIcon, color: statusColor, size: 22),
              const SizedBox(width: 8),
              Text(
                _t(statusKey),
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
    );
  }

  Widget _buildSensorReadings() {
    final vwc = sensor.vwc;
    final soilTemp = sensor.soilTemp;
    final airTemp = sensor.airTemp;

    return Column(
      children: [
        _buildDataRow(
          Icons.water_drop,
          _t('moisture'),
          '${vwc.toStringAsFixed(1)}%',
          Colors.blue,
        ),
        const SizedBox(height: 18),
        _buildDataRow(
          Icons.thermostat,
          _t('temperature'),
          '${soilTemp.toStringAsFixed(1)}${_t('celsius')}',
          Colors.orange,
        ),
        if (airTemp != null) ...[
          const SizedBox(height: 18),
          _buildDataRow(
            Icons.wb_sunny_outlined,
            _isHindi ? 'हवा का तापमान' : 'Air temperature',
            '${airTemp.toStringAsFixed(1)}${_t('celsius')}',
            Colors.deepOrange,
          ),
        ],
      ],
    );
  }

  Widget _buildRangesIfAvailable(BuildContext context) {
    final hasSoilTempRange = sensor.soilTempMin != null ||
        sensor.soilTempOptimal != null ||
        sensor.soilTempMax != null;
    final hasVwcRange = sensor.vwcMin != null ||
        sensor.vwcOptimal != null ||
        sensor.vwcMax != null;

    if (!hasSoilTempRange && !hasVwcRange) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.tune, color: Colors.grey.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                _isHindi ? 'इष्टतम सीमा (फसल)' : 'Optimal ranges (crop)',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade800,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _showInfoDialog(
                  context,
                  _isHindi ? 'इष्टतम सीमा' : 'Optimal ranges',
                  _isHindi
                      ? 'ये मान फसल-आधारित सेटिंग्स से आते हैं (min/optimal/max)।'
                      : 'These values come from crop-based settings (min/optimal/max).',
                ),
                child: const Icon(Icons.info_outline,
                    size: 18, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (hasVwcRange)
            _buildRangeLine(
              label: _isHindi ? 'VWC (%)' : 'VWC (%)',
              min: sensor.vwcMin,
              opt: sensor.vwcOptimal,
              max: sensor.vwcMax,
              unit: '%',
            ),
          if (hasSoilTempRange) ...[
            if (hasVwcRange) const SizedBox(height: 8),
            _buildRangeLine(
              label: _isHindi ? 'मिट्टी तापमान' : 'Soil temp',
              min: sensor.soilTempMin,
              opt: sensor.soilTempOptimal,
              max: sensor.soilTempMax,
              unit: _t('celsius'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRangeLine({
    required String label,
    required double? min,
    required double? opt,
    required double? max,
    required String unit,
  }) {
    String fmt(double? v) => v == null ? '-' : v.toStringAsFixed(1);

    return Row(
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(
          child: Text(
            'min ${fmt(min)}$unit • opt ${fmt(opt)}$unit • max ${fmt(max)}$unit',
            style: TextStyle(fontSize: 13, color: Colors.grey[800]),
          ),
        ),
      ],
    );
  }

  Widget _buildFuzzyAnalysis() {
    final confidence = sensor.confidence.clamp(0.0, 100.0).toDouble();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_t('fuzzyAnalysis')} '
          '(${confidence.toStringAsFixed(0)}${_t('percent')} ${_t('confidence')})',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 12),
        _buildFuzzyBar(_t('dry'), sensor.fuzzyScores.dry, Colors.red),
        const SizedBox(height: 6),
        _buildFuzzyBar(_t('optimal'), sensor.fuzzyScores.optimal, Colors.green),
        const SizedBox(height: 6),
        _buildFuzzyBar(_t('wet'), sensor.fuzzyScores.wet, Colors.blue),
      ],
    );
  }

  Widget _buildCropRecommendation() {
    final cropConfidence = sensor.cropConfidence.clamp(0.0, 100.0).toDouble();
    final bestCrop =
        sensor.bestCrop.trim().isEmpty ? '-' : sensor.bestCrop.toUpperCase();
    final summary = sensor.summary.trim().isEmpty
        ? (_isHindi ? 'जानकारी उपलब्ध नहीं' : 'No details available')
        : sensor.summary;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade50, Colors.green.shade100],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade300, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.agriculture, color: Colors.green.shade700, size: 24),
              const SizedBox(width: 10),
              Text(
                _t('bestCrop'),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.green.shade900,
                ),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade700,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${cropConfidence.toStringAsFixed(0)}${_t('percent')}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            bestCrop,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.green.shade900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            summary,
            style:
                TextStyle(fontSize: 14, color: Colors.grey[800], height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildAlternativeCrops() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.blueGrey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blueGrey.shade200, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.list_alt, color: Colors.blueGrey.shade700, size: 22),
              const SizedBox(width: 10),
              Text(
                _isHindi ? 'अन्य विकल्प' : 'Other options',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.blueGrey.shade900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...sensor.alternativeCrops.take(3).map((c) {
            final suit = c.suitability.clamp(0.0, 100.0).toDouble();
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      c.cropName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  Text(
                    '${suit.toStringAsFixed(0)}${_t('percent')}',
                    style: TextStyle(
                      color: Colors.blueGrey.shade800,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildIrrigationAdvice() {
    final advice = sensor.irrigationAdvice.trim().isEmpty
        ? (_isHindi ? 'कोई सलाह उपलब्ध नहीं' : 'No advice available')
        : sensor.irrigationAdvice;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade300, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb, color: Colors.amber.shade700, size: 26),
              const SizedBox(width: 10),
              Text(
                _t('recommendations'),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.amber.shade900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            advice,
            style:
                TextStyle(fontSize: 15, height: 1.5, color: Colors.grey[800]),
          ),
        ],
      ),
    );
  }

  Widget _buildTimestamp() {
    return Row(
      children: [
        Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
        const SizedBox(width: 6),
        Text(
          '${_t('lastUpdated')}: ${_formatTimestamp(sensor.timestamp)}',
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildDataRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 18,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildFuzzyBar(String label, double value, Color color) {
    final clamped = value.clamp(0.0, 100.0).toDouble();

    return Row(
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(
          child: Stack(
            children: [
              Container(
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              FractionallySizedBox(
                widthFactor: clamped / 100.0,
                child: Container(
                  height: 20,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 40,
          child: Text(
            '${clamped.toStringAsFixed(0)}${_t('percent')}',
            textAlign: TextAlign.right,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inSeconds < 60) {
      return '${difference.inSeconds}s ${_t('timeAgo')}';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ${_t('timeAgo')}';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ${_t('timeAgo')}';
    } else {
      return '${difference.inDays}d ${_t('timeAgo')}';
    }
  }

  void _showInfoDialog(BuildContext context, String title, String message) {
    // BuildContext is only valid while mounted; guard before showing a dialog. [web:302]
    if (!context.mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }
}
