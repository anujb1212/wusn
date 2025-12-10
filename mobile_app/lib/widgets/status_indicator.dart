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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isConnected
            ? Colors.greenAccent.withOpacity(0.2)
            : Colors.grey.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isConnected ? Colors.greenAccent : Colors.grey,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isConnected ? Colors.white : Colors.white70,
            ),
          ),
        ],
      ),
    );
  }
}
