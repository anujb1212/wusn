// lib/screens/crop_confirmation_screen.dart (COMPLETE UPDATED VERSION)

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/sensor_data.dart';

class CropConfirmationScreen extends StatefulWidget {
  final SensorData sensorData;
  final String language;

  const CropConfirmationScreen({
    Key? key,
    required this.sensorData,
    required this.language,
  }) : super(key: key);

  @override
  State<CropConfirmationScreen> createState() => _CropConfirmationScreenState();
}

class _CropConfirmationScreenState extends State<CropConfirmationScreen> {
  String? _selectedCrop;
  String _selectedSoilType = 'LOAM';
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

  final List<Map<String, String>> _soilTypes = [
    {'en': 'Sandy', 'hi': 'रेतीली', 'value': 'SANDY'},
    {'en': 'Loam', 'hi': 'दोमट', 'value': 'LOAM'},
    {'en': 'Clay Loam', 'hi': 'चिकनी दोमट', 'value': 'CLAY_LOAM'},
  ];

  @override
  void initState() {
    super.initState();
    // Pre-select recommended crop if available
    if (widget.sensorData.bestCrop != 'unknown') {
      final recommendedCrop = widget.sensorData.bestCrop.toLowerCase().replaceAll(' ', '');
      
      // Check if this crop exists in our list
      final matchingCrop = _crops.firstWhere(
        (crop) => crop['value']!.toLowerCase() == recommendedCrop,
        orElse: () => <String, String>{},
      );
      
      if (matchingCrop.isNotEmpty) {
        _selectedCrop = matchingCrop['value'];
        print('✅ Pre-selected crop: $_selectedCrop (from recommendation: ${widget.sensorData.bestCrop})');
      } else {
        print('⚠️  Recommended crop "${widget.sensorData.bestCrop}" not found in crop list');
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
        soilType: _selectedSoilType,
      );

      if (result['status'] == 'ok') {
        // Show success dialog
        if (mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              title: Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF4CAF50), size: 28),
                  const SizedBox(width: 8),
                  Text(
                    widget.language == 'hi' ? 'सफलता!' : 'Success!',
                    style: const TextStyle(color: Color(0xFF4CAF50)),
                  ),
                ],
              ),
              content: Text(
                widget.language == 'hi'
                    ? 'फसल की पुष्टि सफल रही। अब आप सिंचाई सलाह देख सकते हैं।'
                    : 'Crop confirmed successfully. You can now check irrigation advice.',
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close dialog
                    Navigator.of(context).pop(true); // Go back with success
                  },
                  child: Text(
                    widget.language == 'hi' ? 'ठीक है' : 'OK',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ],
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _sowingDate,
      firstDate: DateTime.now().subtract(const Duration(days: 180)),
      lastDate: DateTime.now(),
      helpText: widget.language == 'hi' ? 'बुवाई की तारीख चुनें' : 'Select Sowing Date',
      cancelText: widget.language == 'hi' ? 'रद्द करें' : 'Cancel',
      confirmText: widget.language == 'hi' ? 'चुनें' : 'Select',
    );

    if (picked != null && picked != _sowingDate) {
      setState(() {
        _sowingDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.language == 'hi' ? 'फसल की पुष्टि करें' : 'Confirm Crop',
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4CAF50),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Recommendation card
            Card(
              color: const Color(0xFFE8F5E9),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.lightbulb, color: Color(0xFF4CAF50), size: 28),
                        const SizedBox(width: 8),
                        Text(
                          widget.language == 'hi' ? 'सिफारिश' : 'Recommendation',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      widget.language == 'hi'
                          ? 'सर्वोत्तम फसल: ${_getCropNameHi(widget.sensorData.bestCrop)}'
                          : 'Best Crop: ${_getCropNameEn(widget.sensorData.bestCrop)}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.language == 'hi' ? 'विश्वास' : 'Confidence'}: ${widget.sensorData.cropConfidence.toStringAsFixed(1)}%',
                      style: const TextStyle(color: Colors.black54),
                    ),
                    const Divider(height: 24),
                    Text(
                      widget.language == 'hi'
                          ? 'नमी: ${widget.sensorData.moisture} SMU, तापमान: ${widget.sensorData.temperature.toStringAsFixed(1)}°C'
                          : 'Moisture: ${widget.sensorData.moisture} SMU, Temp: ${widget.sensorData.temperature.toStringAsFixed(1)}°C',
                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Crop selection
            Text(
              widget.language == 'hi' ? 'फसल चुनें' : 'Select Crop',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _crops.map((crop) {
                final isSelected = _selectedCrop == crop['value'];
                final isRecommended = widget.sensorData.bestCrop.toLowerCase() == crop['value'];
                
                return ChoiceChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(widget.language == 'hi' ? crop['hi']! : crop['en']!),
                      if (isRecommended) ...[
                        const SizedBox(width: 4),
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                      ],
                    ],
                  ),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCrop = selected ? crop['value'] : null;
                    });
                  },
                  selectedColor: const Color(0xFF4CAF50),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.black87,
                    fontSize: 13,
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // Soil type selection
            Text(
              widget.language == 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedSoilType,
                  isExpanded: true,
                  items: _soilTypes.map((soil) {
                    return DropdownMenuItem(
                      value: soil['value'],
                      child: Text(
                        widget.language == 'hi' ? soil['hi']! : soil['en']!,
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedSoilType = value;
                      });
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Sowing date
            Text(
              widget.language == 'hi' ? 'बुवाई की तारीख' : 'Sowing Date',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            InkWell(
              onTap: _selectDate,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      DateFormat('dd MMM yyyy').format(_sowingDate),
                      style: const TextStyle(fontSize: 16),
                    ),
                    const Icon(Icons.calendar_today, color: Color(0xFF4CAF50)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Error message
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),

            // Confirm button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _confirmCrop,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4CAF50),
                  disabledBackgroundColor: Colors.grey.shade300,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        widget.language == 'hi' 
                            ? 'पुष्टि करें' 
                            : 'Confirm',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getCropNameEn(String crop) {
    final found = _crops.firstWhere(
      (c) => c['value'] == crop.toLowerCase(),
      orElse: () => {'en': crop},
    );
    return found['en']!;
  }

  String _getCropNameHi(String crop) {
    final found = _crops.firstWhere(
      (c) => c['value'] == crop.toLowerCase(),
      orElse: () => {'hi': crop},
    );
    return found['hi']!;
  }
}
