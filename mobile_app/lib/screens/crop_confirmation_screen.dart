import 'package:flutter/material.dart';

import '../models/field_model.dart';
import '../models/sensor_data.dart';
import '../services/api_service.dart';

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

  // Keep current behavior: sowing date defaults to "now".
  late final DateTime _sowingDate;

  bool _isLoading = false;
  bool _isCatalogLoading = true;
  String? _errorMessage;

  List<CropCatalogItem> _catalog = <CropCatalogItem>[];

  bool get _isHindi => widget.language == 'hi';

  // Optional Hindi labels (fallback to English if missing).
  // This does NOT hardcode the crop list; it only provides optional display strings.
  static const Map<String, String> _hiLabels = <String, String>{
    'wheat': 'गेहूं',
    'rice': 'चावल',
    'maize': 'मक्का',
    'chickpea': 'चना',
    'lentil': 'मसूर',
    'pea': 'मटर',
    'mustard': 'सरसों',
    'sugarcane': 'गन्ना',
    'potato': 'आलू',
    'radish': 'मूली',
    'carrot': 'गाजर',
    'tomato': 'टमाटर',
    'spinach': 'पालक',
    'mint': 'पुदीना',
    'cucumber': 'खीरा',
    'watermelon': 'तरबूज',
    'musk_melon': 'खरबूजा',
    'bottle_gourd': 'लौकी',
    'bitter_gourd': 'करेला',
  };

  @override
  void initState() {
    super.initState();

    _sowingDate = DateTime.now();
    _loadCatalogAndPreselect();
  }

  String _normalizeCandidate(String s) {
    return s
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[%\d]+'), '')
        .replaceAll(RegExp(r'[^a-z_ -]'), '')
        .trim()
        .replaceAll(RegExp(r'[\s-]+'), '_');
  }

  String _extractRecommendedCropId(String raw) {
    // Handles: "RADISH 71%", "Radish", "musk_melon", etc.
    final normalized = _normalizeCandidate(raw);
    if (normalized.isEmpty) return '';

    // If it's multiple tokens, keep the first "word-ish" token.
    final parts =
        normalized.split('_').where((p) => p.trim().isNotEmpty).toList();
    if (parts.isEmpty) return normalized;

    // If the original already matches underscore style (like musk_melon), keep it.
    // Otherwise, reduce to the first token to avoid "radish_71" style values.
    if (normalized.contains('_') && parts.length >= 2) return normalized;
    return parts.first;
  }

  String _displayLabel(CropCatalogItem item) {
    if (!_isHindi) return item.labelEn;
    return _hiLabels[item.value] ?? item.labelEn;
  }

  Future<void> _loadCatalogAndPreselect() async {
    setState(() {
      _isCatalogLoading = true;
      _errorMessage = null;
    });

    try {
      final catalog = await ApiService.getCropCatalog();
      if (!mounted) return;

      final recommendedId =
          _extractRecommendedCropId(widget.sensorData.bestCrop);

      String? selected;
      if (recommendedId.isNotEmpty) {
        // 1) Match by canonical value
        final byValue = catalog.where((c) => c.value == recommendedId).toList();
        if (byValue.isNotEmpty) {
          selected = byValue.first.value;
        } else {
          // 2) Try match by labelEn (e.g., recommendation sends "Radish" instead of "radish")
          final recLabelNorm =
              _normalizeCandidate(recommendedId).replaceAll('_', '');
          final byLabel = catalog.where((c) {
            final labelNorm =
                _normalizeCandidate(c.labelEn).replaceAll('_', '');
            return labelNorm == recLabelNorm;
          }).toList();
          if (byLabel.isNotEmpty) selected = byLabel.first.value;
        }
      }

      setState(() {
        _catalog = catalog;
        _selectedCrop = selected;
        _isCatalogLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _catalog = <CropCatalogItem>[];
        _selectedCrop = null;
        _isCatalogLoading = false;
        _errorMessage = _isHindi
            ? 'फसल सूची लोड नहीं हो पाई: ${e.toString().replaceAll('Exception: ', '')}'
            : 'Failed to load crop list: ${e.toString().replaceAll('Exception: ', '')}';
      });
    }
  }

  Future<void> _confirmCrop() async {
    if (_selectedCrop == null) {
      setState(() {
        _errorMessage = _isHindi ? 'कृपया फसल चुनें' : 'Please select a crop';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // ApiService.confirmCrop returns Field (after migration)
      final Field updatedField = await ApiService.confirmCrop(
        nodeId: widget.sensorData.nodeId,
        cropName: _selectedCrop!,
        sowingDate: _sowingDate,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isHindi
                ? 'फसल सफलतापूर्वक पुष्टि की गई!'
                : 'Crop confirmed successfully!',
          ),
          backgroundColor: Colors.green,
        ),
      );

      // Return true so dashboard refreshes.
      Navigator.of(context).pop(true);

      // ignore: unused_local_variable
      final _ = updatedField;
      return;
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _errorMessage = _isHindi
            ? 'त्रुटि: ${e.toString().replaceAll('Exception: ', '')}'
            : 'Error: ${e.toString().replaceAll('Exception: ', '')}';
      });
      return;
    } finally {
      // IMPORTANT: After Navigator.pop, this State may be disposed.
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final recommendedId = _extractRecommendedCropId(widget.sensorData.bestCrop);
    final recommendedItem = _catalog
        .where((c) => c.value == recommendedId)
        .toList()
        .cast<CropCatalogItem?>();
    final recommendedLabel =
        (recommendedItem.isNotEmpty && recommendedItem.first != null)
            ? _displayLabel(recommendedItem.first!)
            : widget.sensorData.bestCrop;

    return Scaffold(
      appBar: AppBar(
        title: Text(_isHindi ? 'फसल की पुष्टि करें' : 'Confirm Crop'),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Recommendation card
          Card(
            elevation: 4,
            color: const Color(0xFFE8F5E9),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                                  _isHindi ? 'सिफारिश' : 'Recommendation',
                                  style: const TextStyle(
                                      fontSize: 12, color: Colors.black54),
                                ),
                                Text(
                                  recommendedLabel.toString().toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF2E7D32),
                                  ),
                                ),
                              ]),
                        ),
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
                    Text(
                      _isHindi ? 'क्यों?' : 'Why?',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.sensorData.summary,
                      style: const TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ]),
            ),
          ),
          const SizedBox(height: 20),

          // Crop dropdown (API-driven)
          DropdownButtonFormField<String>(
            value: (_selectedCrop != null &&
                    _catalog.any((c) => c.value == _selectedCrop))
                ? _selectedCrop
                : null,
            decoration: InputDecoration(
              labelText: _isHindi ? 'फसल चुनें' : 'Select Crop',
              border: const OutlineInputBorder(),
              prefixIcon: _isCatalogLoading
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : const Icon(Icons.agriculture),
            ),
            items: _catalog
                .map(
                  (c) => DropdownMenuItem<String>(
                    value: c.value,
                    child: Text(_displayLabel(c)),
                  ),
                )
                .toList(),
            onChanged: (_isLoading || _isCatalogLoading)
                ? null
                : (v) => setState(() => _selectedCrop = v),
          ),
          const SizedBox(height: 10),

          if (!_isCatalogLoading && _catalog.isEmpty)
            TextButton.icon(
              onPressed: _loadCatalogAndPreselect,
              icon: const Icon(Icons.refresh),
              label: Text(
                  _isHindi ? 'फसल सूची फिर से लोड करें' : 'Reload crop list'),
            ),

          const SizedBox(height: 10),

          // Confirm button
          ElevatedButton(
            onPressed: (_isLoading || _isCatalogLoading || _catalog.isEmpty)
                ? null
                : _confirmCrop,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4CAF50),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 50),
              elevation: 2,
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2.5),
                  )
                : Text(
                    _isHindi ? 'पुष्टि करें' : 'Confirm',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),

          // Error message
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_errorMessage!,
                        style: const TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ),
          ],
        ]),
      ),
    );
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 70) return const Color(0xFF4CAF50);
    if (confidence >= 50) return const Color(0xFFFF9800);
    return const Color(0xFFF44336);
  }
}
