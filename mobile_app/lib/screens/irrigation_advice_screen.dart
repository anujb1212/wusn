
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

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
  Map<String, dynamic>? _decisionData;

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
      // Use new API method that returns decision directly
      final data = await ApiService.getIrrigationRecommendation(widget.fieldId);
      
      print('✅ Irrigation data received: $data');
      
      setState(() {
        _decisionData = data;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Full irrigation error: $e');
      
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
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
            const SizedBox(height: 8),
            Text(
              widget.language == 'hi'
                  ? 'सुझाव: पहले "फसल पुष्टि" करें'
                  : 'Hint: Confirm crop first',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Colors.grey, fontStyle: FontStyle.italic),
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
    if (_decisionData == null) {
      return const Center(child: Text('No data available'));
    }

    final shouldIrrigate = _decisionData!['shouldIrrigate'] ?? false;
    final urgency = _decisionData!['urgency'] ?? 'LOW';
    final reason = _decisionData!['reason'] ?? 'No recommendation';
    final confidence = (_decisionData!['confidence'] ?? 0.0) as num;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main decision card
          _buildDecisionCard(shouldIrrigate, urgency, reason, confidence.toDouble()),
          
          const SizedBox(height: 16),
          
          // Weather card (if available from response)
          if (_decisionData!['weather'] != null)
            _buildWeatherCard(_decisionData!['weather']),
          
          if (_decisionData!['weather'] != null)
            const SizedBox(height: 16),
          
          // Field config (if available from response)
          if (_decisionData!['fieldConfig'] != null)
            _buildFieldConfigCard(_decisionData!['fieldConfig']),
          
          if (_decisionData!['fieldConfig'] != null)
            const SizedBox(height: 16),
          
          // Sensor info
          _buildSensorInfo(),
          
          const SizedBox(height: 16),
          
          // Urgency levels explanation
          _buildUrgencyGuide(),
        ],
      ),
    );
  }

  Widget _buildDecisionCard(bool shouldIrrigate, String urgency, String reason, double confidence) {
    Color color;
    IconData icon;
    String title;
    
    // Determine color based on urgency
    switch (urgency) {
      case 'CRITICAL':
        color = const Color(0xFFD32F2F);
        icon = Icons.warning;
        title = widget.language == 'hi' ? 'तुरंत सिंचाई करें!' : 'IRRIGATE NOW!';
        break;
      case 'HIGH':
        color = const Color(0xFFFF9800);
        icon = Icons.water_drop;
        title = widget.language == 'hi' ? 'जल्द सिंचाई करें' : 'IRRIGATE SOON';
        break;
      case 'MODERATE':
        color = const Color(0xFF2196F3);
        icon = Icons.water;
        title = widget.language == 'hi' ? 'सिंचाई की योजना बनाएं' : 'PLAN IRRIGATION';
        break;
      case 'LOW':
      default:
        color = const Color(0xFF4CAF50);
        icon = Icons.check_circle;
        title = widget.language == 'hi' ? 'प्रतीक्षा करें' : 'SKIP IRRIGATION';
        break;
    }

    return Card(
      color: color.withOpacity(0.1),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(icon, size: 80, color: color),
            const SizedBox(height: 20),
            Text(
              title,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                urgency,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              reason,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, height: 1.5),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.verified, size: 18, color: color),
                const SizedBox(width: 6),
                Text(
                  '${(confidence * 100).toStringAsFixed(0)}% ${widget.language == 'hi' ? 'विश्वास' : 'confidence'}',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeatherCard(Map<String, dynamic> weather) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.wb_sunny, color: const Color(0xFFFF9800)),
                const SizedBox(width: 8),
                Text(
                  widget.language == 'hi' ? 'मौसम की जानकारी' : 'Weather Info',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildWeatherItem(
                  Icons.thermostat,
                  weather['temperature'] != null 
                      ? '${weather['temperature'].toStringAsFixed(1)}°C'
                      : '--',
                  widget.language == 'hi' ? 'तापमान' : 'Temp',
                  const Color(0xFFFF9800),
                ),
                _buildWeatherItem(
                  Icons.water_drop,
                  weather['humidity'] != null
                      ? '${weather['humidity'].toStringAsFixed(0)}%'
                      : '--',
                  widget.language == 'hi' ? 'नमी' : 'Humidity',
                  const Color(0xFF2196F3),
                ),
                _buildWeatherItem(
                  Icons.cloud,
                  weather['next3DaysRain'] != null
                      ? '${weather['next3DaysRain'].toStringAsFixed(1)} mm'
                      : '0 mm',
                  widget.language == 'hi' ? '3 दिन बारिश' : '3d Rain',
                  const Color(0xFF4CAF50),
                ),
              ],
            ),
            if (weather['next3DaysRain'] != null && weather['next3DaysRain'] > 5) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF2196F3).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 20, color: const Color(0xFF2196F3)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.language == 'hi'
                            ? 'आगामी बारिश - सिंचाई स्थगित करें'
                            : 'Rain expected - defer irrigation',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWeatherItem(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, size: 28, color: color),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildFieldConfigCard(Map<String, dynamic> fieldConfig) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.agriculture, color: const Color(0xFF4CAF50)),
                const SizedBox(width: 8),
                Text(
                  widget.language == 'hi' ? 'फसल की जानकारी' : 'Crop Info',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            _buildInfoRow(
              widget.language == 'hi' ? 'फसल' : 'Crop',
              _getCropName(fieldConfig['cropType'] ?? 'unknown'),
            ),
            if (fieldConfig['sowingDate'] != null)
              _buildInfoRow(
                widget.language == 'hi' ? 'बुवाई की तारीख' : 'Sowing Date',
                DateFormat('dd MMM yyyy').format(DateTime.parse(fieldConfig['sowingDate'])),
              ),
            if (fieldConfig['latitude'] != null && fieldConfig['longitude'] != null)
              _buildInfoRow(
                widget.language == 'hi' ? 'स्थान' : 'Location',
                '${fieldConfig['latitude'].toStringAsFixed(4)}, ${fieldConfig['longitude'].toStringAsFixed(4)}',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorInfo() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.sensors, color: const Color(0xFF4CAF50)),
                const SizedBox(width: 8),
                Text(
                  widget.language == 'hi' ? 'सेंसर डेटा' : 'Sensor Data',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            _buildInfoRow(
              widget.language == 'hi' ? 'खेत ID' : 'Field ID',
              'Field ${widget.fieldId}',
            ),
            _buildInfoRow(
              widget.language == 'hi' ? 'स्थिति' : 'Status',
              widget.language == 'hi' ? 'सक्रिय' : 'Active',
            ),
            _buildInfoRow(
              widget.language == 'hi' ? 'अंतिम अपडेट' : 'Last Update',
              DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUrgencyGuide() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: const Color(0xFF2196F3)),
                const SizedBox(width: 8),
                Text(
                  widget.language == 'hi' ? 'तात्कालिकता गाइड' : 'Urgency Guide',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            _buildUrgencyItem(
              'CRITICAL',
              widget.language == 'hi' ? 'तुरंत सिंचाई करें' : 'Irrigate immediately',
              const Color(0xFFD32F2F),
            ),
            _buildUrgencyItem(
              'HIGH',
              widget.language == 'hi' ? '24 घंटे के भीतर' : 'Within 24 hours',
              const Color(0xFFFF9800),
            ),
            _buildUrgencyItem(
              'MODERATE',
              widget.language == 'hi' ? '2-3 दिनों में' : 'Within 2-3 days',
              const Color(0xFF2196F3),
            ),
            _buildUrgencyItem(
              'LOW',
              widget.language == 'hi' ? 'कोई सिंचाई की जरूरत नहीं' : 'No irrigation needed',
              const Color(0xFF4CAF50),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUrgencyItem(String level, String description, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  level,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  description,
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ],
            ),
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
      'chickpea': widget.language == 'hi' ? 'चना' : 'Chickpea',
      'sugarcane': widget.language == 'hi' ? 'गन्ना' : 'Sugarcane',
      'potato': widget.language == 'hi' ? 'आलू' : 'Potato',
      'lentil': widget.language == 'hi' ? 'मसूर' : 'Lentil',
      'pea': widget.language == 'hi' ? 'मटर' : 'Pea',
    };
    return crops[crop.toLowerCase()] ?? crop;
  }
}
