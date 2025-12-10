import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/sensor_data.dart';

class CropConfirmationScreen extends StatefulWidget {
  final SensorData sensorData;
  final String language;

  const CropConfirmationScreen({
    super.key,
    required this.sensorData,
    required this.language,
  });

  @override
  State<CropConfirmationScreen> createState() => _CropConfirmationScreenState();
}

class _CropConfirmationScreenState extends State<CropConfirmationScreen> {
  String? _selectedCrop;
  final DateTime _sowingDate = DateTime.now();
  bool _isLoading = false;
  String? _errorMessage;

  // ✅ FIXED: Only backend-supported crops (UP region)
  final List<Map<String, String>> _crops = [
    {'en': 'Wheat', 'hi': 'गेहूं', 'value': 'wheat'},
    {'en': 'Rice', 'hi': 'चावल', 'value': 'rice'},
    {'en': 'Maize', 'hi': 'मक्का', 'value': 'maize'},
    {'en': 'Chickpea', 'hi': 'चना', 'value': 'chickpea'},
    {'en': 'Lentil', 'hi': 'मसूर', 'value': 'lentil'},
    {'en': 'Pea', 'hi': 'मटर', 'value': 'pea'},
    {'en': 'Mustard', 'hi': 'सरसों', 'value': 'mustard'},
    {'en': 'Sugarcane', 'hi': 'गन्ना', 'value': 'sugarcane'},
    {'en': 'Potato', 'hi': 'आलू', 'value': 'potato'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.sensorData.bestCrop != 'Unknown') {
      final recommendedCrop =
          widget.sensorData.bestCrop.toLowerCase().replaceAll(' ', '');
      final matchingCrop = _crops.firstWhere(
        (crop) => crop['value']!.toLowerCase() == recommendedCrop,
        orElse: () => <String, String>{},
      );
      if (matchingCrop.isNotEmpty) {
        _selectedCrop = matchingCrop['value'];
      }
    }
  }

  Future<void> _confirmCrop() async {
    if (_selectedCrop == null) {
      setState(() {
        _errorMessage = widget.language == 'hi'
            ? 'कृपया फसल चुनें'
            : 'Please select a crop';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService.confirmCrop(
        fieldId: widget.sensorData.nodeId,
        cropName: _selectedCrop!,
        sowingDate: _sowingDate,
      );

      if (result['status'] == 'ok') {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(widget.language == 'hi'
                  ? 'फसल सफलतापूर्वक पुष्टि की गई!'
                  : 'Crop confirmed successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop(true);
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = widget.language == 'hi'
            ? 'त्रुटि: ${e.toString().replaceAll('Exception: ', '')}'
            : 'Error: ${e.toString().replaceAll('Exception: ', '')}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
            widget.language == 'hi' ? 'फसल की पुष्टि करें' : 'Confirm Crop'),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ⭐ Enhanced Recommendation Card
            Card(
              elevation: 4,
              color: const Color(0xFFE8F5E9),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.eco,
                            color: Color(0xFF4CAF50), size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.language == 'hi'
                                    ? 'सिफारिश'
                                    : 'Recommendation',
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.black54),
                              ),
                              Text(
                                widget.sensorData.bestCrop.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF2E7D32),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // ⭐ NEW: Confidence Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _getConfidenceColor(
                                widget.sensorData.cropConfidence),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${widget.sensorData.cropConfidence.toStringAsFixed(0)}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(),
                    // ⭐ NEW: "Why This Crop?" Explanation
                    Text(
                      widget.language == 'hi' ? 'क्यों?' : 'Why?',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.sensorData.summary,
                      style: const TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Crop Dropdown
            DropdownButtonFormField<String>(
              initialValue: _selectedCrop,
              decoration: InputDecoration(
                labelText:
                    widget.language == 'hi' ? 'फसल चुनें' : 'Select Crop',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.agriculture),
              ),
              items: _crops
                  .map((c) => DropdownMenuItem(
                        value: c['value'],
                        child:
                            Text(widget.language == 'hi' ? c['hi']! : c['en']!),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _selectedCrop = v),
            ),
            const SizedBox(height: 20),

            // Confirm Button
            ElevatedButton(
              onPressed: _isLoading ? null : _confirmCrop,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                elevation: 2,
              ),
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      widget.language == 'hi' ? 'पुष्टि करें' : 'Confirm',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),

            // Error Message
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_errorMessage!,
                            style: const TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 70) return const Color(0xFF4CAF50);
    if (confidence >= 50) return const Color(0xFFFF9800);
    return const Color(0xFFF44336);
  }
}
