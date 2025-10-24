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
      default:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_t('node')} ${sensor.id}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.agriculture, size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 6),
                          Text(
                            '${_t('crop')}: ${sensor.cropType}',
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
            _buildDataRow(Icons.water_drop, _t('moisture'), '${sensor.moisture}', Colors.blue),
            const SizedBox(height: 18),
            _buildDataRow(Icons.thermostat, _t('temperature'), '${sensor.temperature}°C', Colors.orange),
            const Divider(height: 32, thickness: 1),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb, color: Color(0xFF4CAF50), size: 26),
                      const SizedBox(width: 10),
                      Text(
                        _t('recommendations'),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    sensor.recommendation,
                    style: const TextStyle(fontSize: 16, height: 1.5),
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
            style: const TextStyle(fontSize: 18, color: Colors.grey, fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
