import 'package:flutter/material.dart';
import '../models/sensor_data.dart';
import '../l10n/translations.dart';

class SensorCard extends StatelessWidget {
  final SensorData sensor;
  final String language;

  const SensorCard({
    Key? key,
    required this.sensor,
    required this.language,
  }) : super(key: key);

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
            // Header with Node ID and Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_t('node')} ${sensor.nodeId}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.agriculture,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${_t('crop')}: ${sensor.bestCrop}',
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: statusColor.withOpacity(0.3),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, color: statusColor, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        _t(status),
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

            const Divider(height: 32, thickness: 1),

            // Sensor Readings
            _buildDataRow(
              Icons.water_drop,
              _t('moisture'),
              '${sensor.moisture} ${_t('smu')}',
              Colors.blue,
            ),
            const SizedBox(height: 18),
            _buildDataRow(
              Icons.thermostat,
              _t('temperature'),
              '${sensor.temperature}${_t('celsius')}',
              Colors.orange,
            ),
            const SizedBox(height: 18),
            _buildDataRow(
              Icons.signal_cellular_alt,
              'RSSI',
              '${sensor.rssi} ${_t('dbm')}',
              Colors.purple,
            ),

            const Divider(height: 32, thickness: 1),

            // Fuzzy Analysis Section
            Text(
              '${_t('fuzzyAnalysis')} (${sensor.confidence}% ${_t('confidence')})',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 12),
            _buildFuzzyBar(
              _t('dry'),
              sensor.fuzzyScores.dry,
              Colors.red,
            ),
            const SizedBox(height: 6),
            _buildFuzzyBar(
              _t('optimal'),
              sensor.fuzzyScores.optimal,
              Colors.green,
            ),
            const SizedBox(height: 6),
            _buildFuzzyBar(
              _t('wet'),
              sensor.fuzzyScores.wet,
              Colors.blue,
            ),

            const Divider(height: 32, thickness: 1),

            // Best Crop Recommendation
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.green.shade50,
                    Colors.green.shade100,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.green.shade300,
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.agriculture,
                        color: Colors.green.shade700,
                        size: 24,
                      ),
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
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.shade700,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${sensor.cropConfidence}%',
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
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[800],
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Irrigation Advice
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.amber.shade300,
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb,
                        color: Colors.amber.shade700,
                        size: 26,
                      ),
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
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.5,
                      color: Colors.grey[800],
                    ),
                  ),
                ],
              ),
            ),

            // Timestamp
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 14,
                  color: Colors.grey[500],
                ),
                const SizedBox(width: 6),
                Text(
                  '${_t('lastUpdated')}: ${_formatTimestamp(sensor.timestamp)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataRow(
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
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
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildFuzzyBar(String label, int value, Color color) {
    return Row(
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
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
            '$value%',
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
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
