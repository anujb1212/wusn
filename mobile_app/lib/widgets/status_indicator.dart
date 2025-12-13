import 'package:flutter/material.dart';

class StatusIndicator extends StatelessWidget {
  final bool isConnected;
  final String label;

  const StatusIndicator({
    super.key,
    required this.isConnected,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final Color dotColor = isConnected ? Colors.green : Colors.grey;
    final Color bgColor =
        (isConnected ? Colors.green : Colors.grey).withOpacity(0.15);

    // Use readable text on a light background.
    final Color textColor = Theme.of(context).colorScheme.onSurface;

    return Semantics(
      // Helps accessibility tools announce the connection state. [web:351]
      label: 'Connection status: $label',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: dotColor.withOpacity(0.35)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: textColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
