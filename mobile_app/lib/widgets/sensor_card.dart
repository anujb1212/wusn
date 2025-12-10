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

  @override
  Widget build(BuildContext context) {
    final status = sensor.status;
    Color statusColor;
    IconData statusIcon;

    switch (status) {
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
            if (sensor.isAggregated) _buildAggregationHeader(),
            _buildMainHeader(statusColor, statusIcon),
            const Divider(height: 32, thickness: 1),
            _buildSensorReadings(), // sirf moisture + temp
            if (sensor.batteryLevel != null) ...[
              const SizedBox(height: 18),
              _buildBatteryIndicator(),
            ],
            const Divider(height: 32, thickness: 1),
            _buildFuzzyAnalysis(),
            const Divider(height: 32, thickness: 1),
            _buildCropRecommendation(),
            const SizedBox(height: 16),
            _buildIrrigationAdvice(),
            if (sensor.isAggregated && sensor.allNodesData != null) ...[
              const SizedBox(height: 16),
              _buildAllNodesSection(), // yahan bhi signal line hata di
            ],
            const SizedBox(height: 16),
            _buildTimestamp(),
          ],
        ),
      ),
    );
  }

  Widget _buildAggregationHeader() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.hub, color: Colors.blue.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                _t('aggregatedData'),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${_t('totalNodes')}: ${sensor.totalNodes} | '
            '${_t('activeNodes')}: ${sensor.activeNodes} | '
            '${_t('blockedNodes')}: ${sensor.blockedNodes}',
            style: TextStyle(fontSize: 12, color: Colors.grey[700]),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  sensor.selectionReason ?? '',
                  style: TextStyle(fontSize: 12, color: Colors.grey[800]),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.shade700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${sensor.selectionScore?.toStringAsFixed(0)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMainHeader(Color statusColor, IconData statusIcon) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${sensor.isAggregated ? _t('selectedNode') : _t('node')} ${sensor.nodeId}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.agriculture, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Text(
                    '${_t('crop')}: ${sensor.bestCrop}',
                    style: TextStyle(fontSize: 15, color: Colors.grey[700]),
                  ),
                ],
              ),
            ],
          ),
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
                _t(sensor.status),
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
    final double vwc = sensor.moistureVWC;

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
          '${sensor.temperature.toStringAsFixed(1)}${_t('celsius')}',
          Colors.orange,
        ),
      ],
    );
  }

  Widget _buildBatteryIndicator() {
    final battery = sensor.batteryLevel!;
    final Color batteryColor = battery > 70
        ? Colors.green
        : battery > 30
            ? Colors.orange
            : Colors.red;

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: batteryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.battery_std, color: batteryColor, size: 28),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            _t('battery'),
            style: const TextStyle(
              fontSize: 18,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          '$battery${_t('percent')}',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildFuzzyAnalysis() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_t('fuzzyAnalysis')} '
          '(${sensor.confidence.toStringAsFixed(0)}${_t('percent')} ${_t('confidence')})',
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
                  '${sensor.cropConfidence.toStringAsFixed(0)}${_t('percent')}',
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
            sensor.bestCrop.toUpperCase(),
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.green.shade900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            sensor.summary,
            style:
                TextStyle(fontSize: 14, color: Colors.grey[800], height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildIrrigationAdvice() {
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
            sensor.irrigationAdvice,
            style:
                TextStyle(fontSize: 15, height: 1.5, color: Colors.grey[800]),
          ),
        ],
      ),
    );
  }

  Widget _buildAllNodesSection() {
    final nodes = sensor.allNodesData!;

    return ExpansionTile(
      title: Text(
        _t('viewAllNodes'),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      children: nodes.map((node) {
        final bool isSelected = node.nodeId == sensor.selectedNodeId;
        final bool isBlocked = node.batteryLevel < 15 || node.rssi < -110;

        // ✅ FIX: If node.moisture is already VWC from backend, use directly
        final double nodeVwc = node.moisture is double
            ? node.moisture
            : (node.moisture as int).toDouble();

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected
                ? Colors.green.shade50
                : isBlocked
                    ? Colors.red.shade50
                    : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? Colors.green.shade300
                  : isBlocked
                      ? Colors.red.shade300
                      : Colors.grey.shade300,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${_t('node')} ${node.nodeId}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.green.shade700
                          : isBlocked
                              ? Colors.red.shade700
                              : Colors.grey.shade700,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isSelected
                          ? _t('active')
                          : isBlocked
                              ? _t('blocked')
                              : _t('active'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${_t('moisture')}: ${nodeVwc.toStringAsFixed(1)}% | '
                '${_t('temperature')}: ${node.temperature.toStringAsFixed(1)}${_t('celsius')}',
                style: const TextStyle(fontSize: 12),
              ),
              Text(
                '${_t('battery')}: ${node.batteryLevel}${_t('percent')}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
        );
      }).toList(),
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
                widthFactor: value / 100,
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
            '${value.toStringAsFixed(0)}${_t('percent')}',
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
}
