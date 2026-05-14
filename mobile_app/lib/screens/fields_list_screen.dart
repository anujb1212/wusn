import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/field_model.dart';
import '../providers/sensor_provider.dart';
import '../services/api_service.dart';

class FieldsListScreen extends StatelessWidget {
  const FieldsListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SensorProvider>(
      builder: (context, provider, child) {
        final fields = provider.fields;

        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'Manage Fields',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            backgroundColor: const Color(0xFF4CAF50),
            foregroundColor: Colors.white,
            elevation: 2,
          ),
          backgroundColor: const Color(0xFFF5F5F5),
          body: fields.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'No fields created yet.\nAdd a field from the dashboard to see it here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: fields.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final field = fields[index];
                    return _FieldTile(field: field);
                  },
                ),
        );
      },
    );
  }
}

class _FieldTile extends StatelessWidget {
  final Field field;

  const _FieldTile({required this.field});

  @override
  Widget build(BuildContext context) {
    final crop = (field.cropType ?? '').trim();
    final hasCrop = crop.isNotEmpty;

    final nodesCount = field.nodesCount ?? 0;

    final lastIrrigation = field.lastIrrigationCheck;
    final lastIrrText = lastIrrigation == null
        ? 'Never checked'
        : _formatRelativeTime(lastIrrigation);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF4CAF50).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.landscape, color: Color(0xFF4CAF50)),
        ),
        title: Text(
          field.fieldName,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              hasCrop ? 'Crop: $crop' : 'No crop confirmed',
              style: TextStyle(
                fontSize: 13,
                color: hasCrop ? Colors.green.shade700 : Colors.grey[700],
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Nodes: $nodesCount • Last irrigation check: $lastIrrText',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'deleteField') {
              _confirmDeleteField(context, field);
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'deleteField',
              child: Text('Delete field'),
            ),
          ],
        ),
      ),
    );
  }

  static String _formatRelativeTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} h ago';
    return '${diff.inDays} d ago';
  }

  Future<void> _confirmDeleteField(BuildContext context, Field field) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete field?'),
        content: Text(
          'Are you sure you want to delete the field "${field.fieldName}"?\n\n'
          'This will remove this field and its data from the app. '
          'Connected sensor nodes can be reassigned later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ApiService.deleteField(field.id);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Field deleted successfully.'),
        ),
      );

      await Provider.of<SensorProvider>(context, listen: false)
          .fetchData(silent: true);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to delete field: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
