import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';
import '../models/field_model.dart';

class FieldSetupScreen extends StatefulWidget {
  final int nodeId;

  const FieldSetupScreen({super.key, required this.nodeId});

  @override
  State<FieldSetupScreen> createState() => _FieldSetupScreenState();
}

class _FieldSetupScreenState extends State<FieldSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fieldNameController = TextEditingController();
  final _latController = TextEditingController(text: '26.8467');
  final _lngController = TextEditingController(text: '80.9462');

  String _soilTexture = 'SANDY_LOAM';
  bool _isLoading = false;
  bool _isGpsLoading = false;
  String? _errorMessage;

  static const List<Map<String, String>> _soilOptions = [
    {'value': 'SANDY', 'label': 'Sandy'},
    {'value': 'SANDY_LOAM', 'label': 'Sandy Loam'},
    {'value': 'LOAM', 'label': 'Loam'},
    {'value': 'CLAY_LOAM', 'label': 'Clay Loam'},
    {'value': 'CLAY', 'label': 'Clay'},
  ];

  @override
  void dispose() {
    _fieldNameController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final fieldData = <String, dynamic>{
        'nodeId': widget.nodeId,
        'fieldName': _fieldNameController.text.trim(),
        'latitude': double.parse(_latController.text.trim()),
        'longitude': double.parse(_lngController.text.trim()),
        'soilTexture': _soilTexture,
      };

      await ApiService.createField(fieldData);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Field created! Now confirm your crop.'),
          backgroundColor: Color(0xFF4CAF50),
          duration: Duration(seconds: 2),
        ),
      );

      // Go back to root (Dashboard will refresh and show new field)
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      setState(() {
        _errorMessage = 'Failed to create field: ${e.message}';
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Unexpected error: $e';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchGpsLocation() async {
    setState(() {
      _isGpsLoading = true;
      _errorMessage = null;
    });
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _errorMessage = 'Location services are disabled.');
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _errorMessage = 'Location permission denied.');
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        setState(() => _errorMessage =
            'Location permission permanently denied. Enable from settings.');
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      setState(() {
        _latController.text = position.latitude.toStringAsFixed(4);
        _lngController.text = position.longitude.toStringAsFixed(4);
      });
    } catch (e) {
      setState(() => _errorMessage = 'GPS error: $e');
    } finally {
      if (mounted) setState(() => _isGpsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text(
          'Setup Field',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
        elevation: 2,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header card
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4CAF50).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.landscape,
                            color: Color(0xFF4CAF50), size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Step 2 of 2',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey)),
                            const Text('Field Configuration',
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold)),
                            Text('Node ID: ${widget.nodeId}',
                                style: const TextStyle(
                                    fontSize: 13, color: Colors.black54)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Field Name
              _buildLabel('Field Name *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _fieldNameController,
                decoration: _inputDecoration(
                  hint: 'e.g. North Field, Plot A',
                  icon: Icons.edit_outlined,
                ),
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Field name is required'
                    : null,
              ),
              const SizedBox(height: 20),

              // Soil Texture
              _buildLabel('Soil Texture *'),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _soilTexture,
                decoration: _inputDecoration(
                  hint: 'Select soil type',
                  icon: Icons.terrain,
                ),
                items: _soilOptions
                    .map((o) => DropdownMenuItem(
                          value: o['value'],
                          child: Text(o['label']!),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _soilTexture = v!),
              ),
              const SizedBox(height: 20),

              // Latitude
              _buildLabel('Latitude *'),
              const SizedBox(height: 4),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed:
                      (_isLoading || _isGpsLoading) ? null : _fetchGpsLocation,
                  icon: _isGpsLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.gps_fixed, color: Color(0xFF4CAF50)),
                  label: Text(
                    _isGpsLoading
                        ? 'Getting location...'
                        : 'Auto-fill from GPS',
                    style: const TextStyle(color: Color(0xFF4CAF50)),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF4CAF50)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _latController,
                keyboardType: const TextInputType.numberWithOptions(
                    decimal: true, signed: true),
                decoration: _inputDecoration(
                  hint: 'e.g. 26.8467',
                  icon: Icons.my_location,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final n = double.tryParse(v.trim());
                  if (n == null || n < -90 || n > 90)
                    return 'Enter valid latitude (-90 to 90)';
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Longitude
              _buildLabel('Longitude *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _lngController,
                keyboardType: const TextInputType.numberWithOptions(
                    decimal: true, signed: true),
                decoration: _inputDecoration(
                  hint: 'e.g. 80.9462',
                  icon: Icons.location_on_outlined,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final n = double.tryParse(v.trim());
                  if (n == null || n < -180 || n > 180)
                    return 'Enter valid longitude (-180 to 180)';
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Error
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    border: Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline,
                          color: Colors.red.shade600, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_errorMessage!,
                            style: TextStyle(color: Colors.red.shade700)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Submit
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submit,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle_outline),
                  label: Text(
                    _isLoading ? 'Creating Field...' : 'Complete Setup',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4CAF50),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(text,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14));
  }

  InputDecoration _inputDecoration(
      {required String hint, required IconData icon}) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: const Color(0xFF4CAF50)),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
      ),
    );
  }
}
