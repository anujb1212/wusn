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
  DateTime _sowingDate = DateTime.now();
  bool _isLoading = false;
  String? _errorMessage;

  // Complete crop list from dataset (22 crops)
  final List<Map<String, String>> _crops = [
    {'en': 'Rice', 'hi': 'चावल', 'value': 'rice'},
    {'en': 'Maize', 'hi': 'मक्का', 'value': 'maize'},
    {'en': 'Chickpea', 'hi': 'चना', 'value': 'chickpea'},
    {'en': 'Kidney Beans', 'hi': 'राजमा', 'value': 'kidneybeans'},
    {'en': 'Pigeon Peas', 'hi': 'अरहर', 'value': 'pigeonpeas'},
    {'en': 'Moth Beans', 'hi': 'मोठ', 'value': 'mothbeans'},
    {'en': 'Mung Bean', 'hi': 'मूंग', 'value': 'mungbean'},
    {'en': 'Black Gram', 'hi': 'उड़द', 'value': 'blackgram'},
    {'en': 'Lentil', 'hi': 'मसूर', 'value': 'lentil'},
    {'en': 'Pomegranate', 'hi': 'अनार', 'value': 'pomegranate'},
    {'en': 'Banana', 'hi': 'केला', 'value': 'banana'},
    {'en': 'Mango', 'hi': 'आम', 'value': 'mango'},
    {'en': 'Grapes', 'hi': 'अंगूर', 'value': 'grapes'},
    {'en': 'Watermelon', 'hi': 'तरबूज', 'value': 'watermelon'},
    {'en': 'Muskmelon', 'hi': 'खरबूजा', 'value': 'muskmelon'},
    {'en': 'Apple', 'hi': 'सेब', 'value': 'apple'},
    {'en': 'Orange', 'hi': 'संतरा', 'value': 'orange'},
    {'en': 'Papaya', 'hi': 'पपीता', 'value': 'papaya'},
    {'en': 'Coconut', 'hi': 'नारियल', 'value': 'coconut'},
    {'en': 'Cotton', 'hi': 'कपास', 'value': 'cotton'},
    {'en': 'Jute', 'hi': 'जूट', 'value': 'jute'},
    {'en': 'Coffee', 'hi': 'कॉफी', 'value': 'coffee'},
  ];

  @override
  void initState() {
    super.initState();
    // Pre-select recommended crop if available
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
      // ✅ FIXED: Using correct API method with proper parameters
      final result = await ApiService.confirmCrop(
        fieldId: widget.sensorData.nodeId, // nodeId is the field identifier
        cropName: _selectedCrop!, // Will be lowercased in ApiService
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
          Navigator.of(context).pop(true); // Return true to trigger refresh
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
          children: [
            Card(
              color: const Color(0xFFE8F5E9),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      widget.language == 'hi'
                          ? 'सुझाव: ${widget.sensorData.bestCrop}'
                          : 'Recommendation: ${widget.sensorData.bestCrop}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              initialValue: _selectedCrop,
              decoration: InputDecoration(
                labelText: widget.language == 'hi' ? 'फसल' : 'Crop',
                border: const OutlineInputBorder(),
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
            ElevatedButton(
              onPressed: _isLoading ? null : _confirmCrop,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(widget.language == 'hi' ? 'पुष्टि करें' : 'Confirm'),
            ),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(_errorMessage!,
                    style: const TextStyle(color: Colors.red)),
              ),
          ],
        ),
      ),
    );
  }
}
