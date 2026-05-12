import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/field_model.dart';

class AddNodeToFieldScreen extends StatefulWidget {
  const AddNodeToFieldScreen({super.key});

  @override
  State<AddNodeToFieldScreen> createState() => _AddNodeToFieldScreenState();
}

class _AddNodeToFieldScreenState extends State<AddNodeToFieldScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nodeIdCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _depthCtrl = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;

  List<Field> _fields = [];
  int? _selectedFieldId;
  bool _isFieldsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFields();
  }

  Future<void> _loadFields() async {
    try {
      final fields = await ApiService.getFields();
      if (!mounted) return;
      setState(() {
        _fields = fields;
        _isFieldsLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isFieldsLoading = false;
        _errorMessage = 'Could not load fields: $e';
      });
    }
  }

  @override
  void dispose() {
    _nodeIdCtrl.dispose();
    _locationCtrl.dispose();
    _depthCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedFieldId == null) {
      setState(() => _errorMessage = 'Please select a field');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final nodeId = int.parse(_nodeIdCtrl.text.trim());

      final nodeData = <String, dynamic>{'nodeId': nodeId};
      if (_locationCtrl.text.trim().isNotEmpty) {
        nodeData['location'] = _locationCtrl.text.trim();
      }
      if (_depthCtrl.text.trim().isNotEmpty) {
        nodeData['burialDepth'] = int.parse(_depthCtrl.text.trim());
      }

      final node = await ApiService.createNode(nodeData);
      await ApiService.assignNodeToField(
        fieldId: _selectedFieldId!,
        nodeId: node.nodeId,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Node added! It will appear on dashboard after first reading.'),
          backgroundColor: Color(0xFF4CAF50),
        ),
      );

      Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _errorMessage = 'Failed: ${e.message}');
    } catch (e) {
      setState(() => _errorMessage = 'Unexpected error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Add Node to Field',
            style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2196F3).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.sensors,
                          color: Color(0xFF2196F3), size: 28),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Add Sensor Node',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                          Text(
                            'Register a new node in an existing field.\nField config will be auto-inherited.',
                            style:
                                TextStyle(fontSize: 12, color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                  ]),
                ),
              ),
              const SizedBox(height: 24),
              _buildLabel('Select Field *'),
              const SizedBox(height: 8),
              _isFieldsLoading
                  ? const Center(child: CircularProgressIndicator())
                  : DropdownButtonFormField<int>(
                      initialValue: _selectedFieldId,
                      decoration: _inputDeco(
                          hint: 'Select field', icon: Icons.landscape),
                      items: _fields
                          .map((f) => DropdownMenuItem<int>(
                                value: f.id,
                                child: Text(f.fieldName),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _selectedFieldId = v),
                    ),
              const SizedBox(height: 16),
              _buildLabel('Node ID *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nodeIdCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDeco(hint: 'e.g. 4', icon: Icons.tag),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final n = int.tryParse(v.trim());
                  if (n == null || n <= 0) {
                    return 'Enter a valid positive number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildLabel('Location in field (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _locationCtrl,
                decoration: _inputDeco(
                    hint: 'e.g. North corner', icon: Icons.place_outlined),
              ),
              const SizedBox(height: 16),
              _buildLabel('Burial Depth in cm (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _depthCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDeco(hint: 'e.g. 30', icon: Icons.straighten),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  final n = int.tryParse(v.trim());
                  if (n == null || n <= 0) return 'Enter valid depth';
                  return null;
                },
              ),
              const SizedBox(height: 32),
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    border: Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(children: [
                    Icon(Icons.error_outline,
                        color: Colors.red.shade600, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                        child: Text(_errorMessage!,
                            style: TextStyle(color: Colors.red.shade700))),
                  ]),
                ),
                const SizedBox(height: 16),
              ],
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
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.check_circle_outline),
                  label: Text(
                    _isLoading ? 'Adding Node...' : 'Add Node',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2196F3),
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

  Widget _buildLabel(String text) => Text(text,
      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14));

  InputDecoration _inputDeco({required String hint, required IconData icon}) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: const Color(0xFF2196F3)),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF2196F3), width: 2)),
    );
  }
}
