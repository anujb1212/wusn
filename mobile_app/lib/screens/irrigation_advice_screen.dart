// lib/screens/irrigation_advice_screen.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/irrigation_decision.dart';

class IrrigationAdviceScreen extends StatefulWidget {
  final int fieldId;
  final String language;

  const IrrigationAdviceScreen({
    Key? key,
    required this.fieldId,
    required this.language,
  }) : super(key: key);

  @override
  State<IrrigationAdviceScreen> createState() => _IrrigationAdviceScreenState();
}

class _IrrigationAdviceScreenState extends State<IrrigationAdviceScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _adviceData;
  IrrigationDecision? _decision;

  @override
  void initState() {
    super.initState();
    _fetchAdvice();
  }

  Future<void> _fetchAdvice() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await ApiService.getIrrigationAdvice(widget.fieldId);
      
      if (data['status'] == 'ok') {
        setState(() {
          _adviceData = data['data'];
          _decision = IrrigationDecision.fromJson(data['data']['decision']);
          _isLoading = false;
        });
      } else {
        throw Exception(data['message'] ?? 'Unknown error');
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.language == 'hi' ? 'सिंचाई सलाह' : 'Irrigation Advice',
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4CAF50),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchAdvice,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? _buildError()
              : _buildContent(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchAdvice,
              child: Text(widget.language == 'hi' ? 'पुनः प्रयास करें' : 'Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_decision == null || _adviceData == null) {
      return const Center(child: Text('No data available'));
    }

    final field = _adviceData!['field'];
    final sensor = _adviceData!['sensorData'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main decision card
          _buildDecisionCard(),
          
          const SizedBox(height: 16),
          
          // Field info
          _buildFieldInfo(field),
          
          const SizedBox(height: 16),
          
          // Sensor data
          _buildSensorData(sensor),
          
          const SizedBox(height: 16),
          
          // Growth stage
          if (_decision!.growthInfo != null)
            _buildGrowthStage(),
          
          const SizedBox(height: 16),
          
          // Weather forecast
          if (_decision!.weather != null)
            _buildWeather(),
          
          const SizedBox(height: 16),
          
          // Irrigation pattern
          if (_decision!.pattern != null)
            _buildIrrigationPattern(),
        ],
      ),
    );
  }

  Widget _buildDecisionCard() {
    final shouldIrrigate = _decision!.shouldIrrigate;
    final color = shouldIrrigate ? const Color(0xFF2196F3) : const Color(0xFF4CAF50);
    final icon = shouldIrrigate ? Icons.water_drop : Icons.check_circle;

    return Card(
      color: color.withOpacity(0.1),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(icon, size: 64, color: color),
            const SizedBox(height: 16),
            Text(
              shouldIrrigate
                  ? (widget.language == 'hi' ? 'सिंचाई करें' : 'IRRIGATE')
                  : (widget.language == 'hi' ? 'प्रतीक्षा करें' : 'SKIP'),
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              widget.language == 'hi' 
                  ? _decision!.reasonHi 
                  : _decision!.reasonEn,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            if (shouldIrrigate && _decision!.recommendedDepthMm > 0) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${_decision!.recommendedDepthMm.toStringAsFixed(0)} mm',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.verified, size: 16, color: color),
                const SizedBox(width: 4),
                Text(
                  '${(_decision!.confidence * 100).toStringAsFixed(0)}% ${widget.language == 'hi' ? 'विश्वास' : 'confidence'}',
                  style: TextStyle(color: color, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFieldInfo(Map<String, dynamic> field) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.language == 'hi' ? 'खेत की जानकारी' : 'Field Information',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            _buildInfoRow(
              widget.language == 'hi' ? 'फसल' : 'Crop',
              _getCropName(field['cropName']),
            ),
            _buildInfoRow(
              widget.language == 'hi' ? 'वृद्धि चरण' : 'Growth Stage',
              _getStageNameHi(field['growthStage']),
            ),
            _buildInfoRow(
              widget.language == 'hi' ? 'संचित GDD' : 'Accumulated GDD',
              '${field['accumulatedGDD'].toStringAsFixed(1)}',
            ),
            _buildInfoRow(
              widget.language == 'hi' ? 'दिन बीते' : 'Days Elapsed',
              '${field['daysElapsed']} ${widget.language == 'hi' ? 'दिन' : 'days'}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorData(Map<String, dynamic> sensor) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.language == 'hi' ? 'सेंसर डेटा' : 'Sensor Data',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            Row(
              children: [
                Expanded(
                  child: _buildSensorCard(
                    Icons.water_drop,
                    '${sensor['moisturePct'].toStringAsFixed(1)}%',
                    widget.language == 'hi' ? 'नमी' : 'Moisture',
                    const Color(0xFF2196F3),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSensorCard(
                    Icons.thermostat,
                    '${sensor['temperature'].toStringAsFixed(1)}°C',
                    widget.language == 'hi' ? 'तापमान' : 'Temperature',
                    const Color(0xFFFF9800),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.language == 'hi' ? 'अंतिम अपडेट' : 'Last update'}: ${DateFormat('dd MMM, hh:mm a').format(DateTime.parse(sensor['timestamp']))}',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrowthStage() {
    final growth = _decision!.growthInfo!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.language == 'hi' ? 'वृद्धि की प्रगति' : 'Growth Progress',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: growth.progress / 100,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
              minHeight: 10,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${growth.progress.toStringAsFixed(1)}%'),
                Text(
                  _getStageNameHi(growth.stage),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.language == 'hi' ? 'पानी की मांग गुणांक (Kc)' : 'Water demand (Kc)'}: ${growth.kc.toStringAsFixed(2)}',
              style: const TextStyle(color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeather() {
    final weather = _decision!.weather!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.language == 'hi' ? 'मौसम पूर्वानुमान' : 'Weather Forecast',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            _buildInfoRow(
              widget.language == 'hi' ? '3 दिन में बारिश' : 'Rain (3 days)',
              '${weather.next3DaysRainMm.toStringAsFixed(1)} mm',
            ),
            _buildInfoRow(
              widget.language == 'hi' ? 'औसत तापमान (7 दिन)' : 'Avg temp (7 days)',
              '${weather.avgTempNext7Days.toStringAsFixed(1)}°C',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIrrigationPattern() {
    final pattern = _decision!.pattern!;
    
    return Card(
      color: const Color(0xFFF3E5F5),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.water, color: Color(0xFF9C27B0)),
                const SizedBox(width: 8),
                Text(
                  widget.language == 'hi' ? 'सिंचाई विधि' : 'Irrigation Method',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              _getPatternType(pattern.type),
              style: const TextStyle(fontSize: 16),
            ),
            if (pattern.durationMinutes != null) ...[
              const SizedBox(height: 4),
              Text(
                '${widget.language == 'hi' ? 'अवधि' : 'Duration'}: ${pattern.durationMinutes} ${widget.language == 'hi' ? 'मिनट' : 'minutes'}',
                style: const TextStyle(color: Colors.black54),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              pattern.notes,
              style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorCard(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  String _getCropName(String crop) {
    final crops = {
      'wheat': widget.language == 'hi' ? 'गेहूं' : 'Wheat',
      'rice': widget.language == 'hi' ? 'चावल' : 'Rice',
      'maize': widget.language == 'hi' ? 'मक्का' : 'Maize',
      'mustard': widget.language == 'hi' ? 'सरसों' : 'Mustard',
    };
    return crops[crop.toLowerCase()] ?? crop;
  }

  String _getStageNameHi(String stage) {
    if (widget.language != 'hi') return stage;
    
    final stages = {
      'INITIAL': 'प्रारंभिक',
      'DEVELOPMENT': 'विकास',
      'MID_SEASON': 'मध्य-मौसम',
      'LATE_SEASON': 'देर से मौसम',
      'HARVEST_READY': 'कटाई',
    };
    return stages[stage] ?? stage;
  }

  String _getPatternType(String type) {
    if (widget.language == 'hi') {
      final types = {
        'drip': 'ड्रिप',
        'sprinkler': 'फव्वारा',
        'flood': 'बाढ़',
        'skip': 'प्रतीक्षा करें',
      };
      return types[type] ?? type;
    }
    return type.toUpperCase();
  }
}
