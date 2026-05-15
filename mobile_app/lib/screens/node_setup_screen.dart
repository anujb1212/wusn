import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NodeSetupScreen extends StatefulWidget {
  final int fieldId;

  const NodeSetupScreen({super.key, required this.fieldId});

  @override
  State<NodeSetupScreen> createState() => _NodeSetupScreenState();
}

class _NodeSetupScreenState extends State<NodeSetupScreen> {
  bool _isLoading = false;
  String? _errorMessage;

  final List<_NodeEntry> _nodes = [_NodeEntry()];

  @override
  void dispose() {
    for (final n in _nodes) {
      n.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _errorMessage = null);

    bool allValid = true;
    for (final n in _nodes) {
      if (!n.formKey.currentState!.validate()) allValid = false;
    }
    if (!allValid) return;

    final ids = _nodes.map((n) => n.nodeIdCtrl.text.trim()).toList();
    if (ids.toSet().length != ids.length) {
      setState(() => _errorMessage = 'Duplicate Node IDs found.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      for (final n in _nodes) {
        final nodeId = int.tryParse(n.nodeIdCtrl.text.trim());
        final burialDepth = n.depthCtrl.text.trim().isNotEmpty
            ? int.tryParse(n.depthCtrl.text.trim())
            : null;
        final distanceToGW = n.distanceCtrl.text.trim().isNotEmpty
            ? int.tryParse(n.distanceCtrl.text.trim())
            : null;

        if (nodeId == null) {
          throw Exception('Invalid node ID');
        }

        final nodeData = <String, dynamic>{
          'nodeId': nodeId,
          if (n.locationCtrl.text.trim().isNotEmpty)
            'location': n.locationCtrl.text.trim(),
          if (burialDepth != null) 'burialDepth': burialDepth,
          if (distanceToGW != null) 'distanceToGW': distanceToGW,
        };

        final node = await ApiService.createNode(nodeData);

        await ApiService.assignNodeToField(
          fieldId: widget.fieldId,
          nodeId: node.nodeId,
        );
      }

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Setup complete! Nodes added to field.'),
          backgroundColor: Color(0xFF4CAF50),
        ),
      );

      Navigator.of(context).popUntil((r) => r.isFirst);
    } on ApiException catch (e) {
      setState(() => _errorMessage = 'Failed to create node: ${e.message}');
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
        title: const Text(
          'Setup Sensor Nodes',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
        elevation: 2,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
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
                        color: const Color(0xFF4CAF50).withValues(alpha: 0.1),
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
                          Text('Step 2 of 2',
                              style:
                                  TextStyle(fontSize: 12, color: Colors.grey)),
                          Text('Add Sensor Nodes',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('Register nodes for your field',
                              style: TextStyle(
                                  fontSize: 13, color: Colors.black54)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Dynamic node forms
            ..._nodes.asMap().entries.map((entry) {
              return _buildNodeForm(entry.key, entry.value);
            }),

            // Add node button (max 5)
            if (_nodes.length < 5)
              TextButton.icon(
                onPressed: () => setState(() => _nodes.add(_NodeEntry())),
                icon: const Icon(Icons.add, color: Color(0xFF4CAF50)),
                label: const Text('Add another node',
                    style: TextStyle(color: Color(0xFF4CAF50))),
              ),

            const SizedBox(height: 16),

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
                  _isLoading ? 'Creating Nodes...' : 'Complete Setup',
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
    );
  }

  Widget _buildNodeForm(int index, _NodeEntry n) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: n.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('Node ${index + 1}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15)),
                  const Spacer(),
                  if (_nodes.length > 1)
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline,
                          color: Colors.red),
                      onPressed: () {
                        final removed = _nodes.removeAt(index);
                        removed.dispose();

                        setState(() {});
                      },
                    ),
                ],
              ),
              const SizedBox(height: 12),
              _buildLabel('Node ID *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: n.nodeIdCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(hint: 'e.g. 1', icon: Icons.tag),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final num = int.tryParse(v.trim());
                  if (num == null || num <= 0) {
                    return 'Enter a valid positive number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              _buildLabel('Location (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: n.locationCtrl,
                decoration: _inputDecoration(
                    hint: 'e.g. North Field', icon: Icons.place_outlined),
              ),
              const SizedBox(height: 12),
              _buildLabel('Burial Depth in cm (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: n.depthCtrl,
                keyboardType: TextInputType.number,
                decoration:
                    _inputDecoration(hint: 'e.g. 30', icon: Icons.straighten),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  final num = int.tryParse(v.trim());
                  if (num == null || num <= 0) return 'Enter a valid depth';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              _buildLabel('Distance from Gateway in m (optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: n.distanceCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(
                    hint: 'e.g. 50', icon: Icons.settings_input_antenna),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  final num = int.tryParse(v.trim());
                  if (num == null || num <= 0) return 'Enter a valid distance';
                  return null;
                },
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

class _NodeEntry {
  final nodeIdCtrl = TextEditingController();
  final locationCtrl = TextEditingController();
  final depthCtrl = TextEditingController();
  final distanceCtrl = TextEditingController();
  final formKey = GlobalKey<FormState>();

  void dispose() {
    nodeIdCtrl.dispose();
    locationCtrl.dispose();
    depthCtrl.dispose();
    distanceCtrl.dispose();
  }
}
