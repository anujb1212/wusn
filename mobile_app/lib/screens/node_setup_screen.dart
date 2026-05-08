import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'field_setup_screen.dart';

class NodeSetupScreen extends StatefulWidget {
  NodeSetupScreen({super.key});

  @override
  State<NodeSetupScreen> createState() => _NodeSetupScreenState();
}

class _NodeSetupScreenState extends State<NodeSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nodeIdController = TextEditingController();
  final _locationController = TextEditingController();
  final _burialDepthController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nodeIdController.dispose();
    _locationController.dispose();
    _burialDepthController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final nodeData = <String, dynamic>{
        'nodeId': int.parse(_nodeIdController.text.trim()),
        if (_locationController.text.trim().isNotEmpty)
          'location': _locationController.text.trim(),
        if (_burialDepthController.text.trim().isNotEmpty)
          'burialDepth': int.parse(_burialDepthController.text.trim()),
      };

      await ApiService.createNode(nodeData);

      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => FieldSetupScreen(
            nodeId: int.parse(_nodeIdController.text.trim()),
          ),
        ),
      );
    } on ApiException catch (e) {
      setState(() {
        _errorMessage = 'Failed to create node: ${e.message}';
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Unexpected error: $e';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text(
          'Setup Sensor Node',
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
                        child: const Icon(Icons.sensors,
                            color: Color(0xFF4CAF50), size: 28),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Step 1 of 2',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey)),
                            Text('Node Configuration',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold)),
                            Text('Register your sensor node',
                                style: TextStyle(
                                    fontSize: 13, color: Colors.black54)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Node ID
              _buildLabel('Node ID *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nodeIdController,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(
                  hint: 'e.g. 1, 2, 3',
                  icon: Icons.tag,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Node ID is required';
                  final n = int.tryParse(v.trim());
                  if (n == null || n <= 0) return 'Enter a valid positive number';
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Location
              _buildLabel('Location (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _locationController,
                decoration: _inputDecoration(
                  hint: 'e.g. North Field, Plot A',
                  icon: Icons.place_outlined,
                ),
              ),
              const SizedBox(height: 20),

              // Burial Depth
              _buildLabel('Burial Depth in cm (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _burialDepthController,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(
                  hint: 'e.g. 30',
                  icon: Icons.straighten,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  final n = int.tryParse(v.trim());
                  if (n == null || n <= 0) return 'Enter a valid depth';
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

              // Submit button
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
                      : const Icon(Icons.arrow_forward),
                  label: Text(
                    _isLoading ? 'Creating Node...' : 'Continue to Field Setup',
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

  InputDecoration _inputDecoration({required String hint, required IconData icon}) {
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