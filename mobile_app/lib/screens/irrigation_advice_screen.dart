import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class IrrigationAdviceScreen extends StatefulWidget {
  final int fieldId;
  final String language;

  const IrrigationAdviceScreen({
    super.key,
    required this.fieldId,
    required this.language,
  });

  @override
  State<IrrigationAdviceScreen> createState() => _IrrigationAdviceScreenState();
}

class _IrrigationAdviceScreenState extends State<IrrigationAdviceScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _decisionData;
  Map<String, dynamic>? _weatherData;

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
      final results = await Future.wait([
        ApiService.getIrrigationRecommendation(widget.fieldId),
        ApiService.getWeatherForecast(widget.fieldId).catchError((e) {
          print('⚠️ Weather data unavailable: $e');
          return <String, dynamic>{};
        }),
      ]);

      setState(() {
        _decisionData = results[0];
        _weatherData = results[1].isNotEmpty ? results[1] : null;
        _isLoading = false;
      });
    } catch (e) {
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
            Text(_errorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              widget.language == 'hi'
                  ? 'सुझाव: पहले "फसल पुष्टि" करें'
                  : 'Hint: Confirm crop first',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchAdvice,
              child:
                  Text(widget.language == 'hi' ? 'पुनः प्रयास करें' : 'Retry'),
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

    final urgency = _decisionData!['urgency'] ?? 'LOW';
    final reason = _decisionData!['reason'] ?? 'No recommendation';
    final urgencyScore = _decisionData!['urgencyScore'] ?? 0;

    // ✅ FIX: Invert confidence - NONE urgency = HIGH confidence
    final confidence =
        urgency == 'NONE' ? 0.95 : (urgencyScore / 100.0).clamp(0.0, 1.0);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDecisionCard(urgency, reason, confidence),
          const SizedBox(height: 16),
          if (_weatherData != null) _buildWeatherCard(),
          if (_weatherData != null) const SizedBox(height: 16),
          _buildIrrigationDetailsCard(),
          const SizedBox(height: 16),
          _buildCropInfoCard(),
          const SizedBox(height: 16),
          _buildSensorInfo(),
          const SizedBox(height: 16),
          _buildUrgencyGuide(),
        ],
      ),
    );
  }

  Widget _buildDecisionCard(String urgency, String reason, double confidence) {
    Color color;
    IconData icon;
    String title;

    switch (urgency) {
      case 'CRITICAL':
        color = const Color(0xFFD32F2F);
        icon = Icons.warning;
        title =
            widget.language == 'hi' ? 'तुरंत सिंचाई करें!' : 'IRRIGATE NOW!';
        break;
      case 'HIGH':
        color = const Color(0xFFFF9800);
        icon = Icons.water_drop;
        title = widget.language == 'hi' ? 'जल्द सिंचाई करें' : 'IRRIGATE SOON';
        break;
      case 'MODERATE':
        color = const Color(0xFF2196F3);
        icon = Icons.water;
        title = widget.language == 'hi'
            ? 'सिंचाई की योजना बनाएं'
            : 'PLAN IRRIGATION';
        break;
      case 'LOW':
        color = const Color(0xFF9C27B0);
        icon = Icons.check_circle_outline;
        title = widget.language == 'hi' ? 'जल्द आवश्यकता नहीं' : 'NO URGENCY';
        break;
      case 'NONE':
      default:
        color = const Color(0xFF4CAF50);
        icon = Icons.check_circle;
        title = widget.language == 'hi' ? 'सिंचाई न करें' : 'SKIP IRRIGATION';
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
            Text(title,
                style: TextStyle(
                    fontSize: 28, fontWeight: FontWeight.bold, color: color),
                textAlign: TextAlign.center),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                  color: color, borderRadius: BorderRadius.circular(20)),
              child: Text(urgency,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 20),
            Text(reason,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, height: 1.5)),
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
                        fontSize: 16)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeatherCard() {
    if (_weatherData == null || _weatherData!['forecast'] == null) {
      return const SizedBox.shrink();
    }

    final forecast = _weatherData!['forecast'] as List<dynamic>;
    // ✅ FIX: Backend uses 'precipitation' not 'rain'
    final totalRain = forecast.fold<double>(0,
        (sum, day) => sum + ((day['precipitation'] as num?) ?? 0).toDouble());

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
                const Icon(Icons.wb_sunny, color: Color(0xFFFF9800)),
                const SizedBox(width: 8),
                Text(
                    widget.language == 'hi'
                        ? '5-दिन मौसम पूर्वानुमान'
                        : '5-Day Weather Forecast',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            ...forecast.take(5).map((day) => _buildWeatherRow(day)),
            if (totalRain > 5) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF2196F3).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline,
                        size: 20, color: Color(0xFF2196F3)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.language == 'hi'
                            ? '💡 ${totalRain.toStringAsFixed(0)}mm बारिश अपेक्षित - सिंचाई स्थगित करें'
                            : '💡 ${totalRain.toStringAsFixed(0)}mm rain expected - defer irrigation',
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w500),
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

  Widget _buildWeatherRow(Map<String, dynamic> day) {
    final date = DateTime.parse(day['date']);
    // ✅ FIX: Backend uses 'tempAvg' and 'precipitation'
    final temp = (day['tempAvg'] as num?)?.toDouble() ?? 0;
    final rain = (day['precipitation'] as num?)?.toDouble() ?? 0;

    String weatherIcon = '☀️';
    if (rain > 10) {
      weatherIcon = '🌧️';
    } else if (rain > 2) {
      weatherIcon = '⛅';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(DateFormat('EEE, MMM d').format(date),
              style: const TextStyle(fontSize: 13)),
          Row(
            children: [
              Text(weatherIcon, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text('${temp.toStringAsFixed(0)}°C',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w500)),
              const SizedBox(width: 16),
              Text('${rain.toStringAsFixed(0)}mm',
                  style: TextStyle(
                      fontSize: 13,
                      color: rain > 5 ? const Color(0xFF2196F3) : Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIrrigationDetailsCard() {
    if (_decisionData == null) return const SizedBox.shrink();

    final currentVWC = _decisionData!['currentVWC'];
    final targetVWC = _decisionData!['targetVWC'];
    final deficit = _decisionData!['deficit'];
    final suggestedDepth = _decisionData!['suggestedDepthMm'];
    final suggestedDuration = _decisionData!['suggestedDurationMin'];

    if (currentVWC == null) return const SizedBox.shrink();

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
                const Icon(Icons.water_drop, color: Color(0xFF2196F3)),
                const SizedBox(width: 8),
                Text(
                    widget.language == 'hi'
                        ? 'सिंचाई विवरण'
                        : 'Irrigation Details',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            _buildInfoRowWithTooltip(
              widget.language == 'hi' ? 'वर्तमान नमी' : 'Current Moisture',
              '${currentVWC.toStringAsFixed(1)}%',
              widget.language == 'hi'
                  ? 'सेंसर द्वारा मापी गई'
                  : 'Measured by sensor',
            ),
            if (targetVWC != null)
              _buildInfoRowWithTooltip(
                widget.language == 'hi' ? 'लक्ष्य नमी' : 'Target Moisture',
                '${targetVWC.toStringAsFixed(1)}%',
                widget.language == 'hi'
                    ? 'फसल के लिए आदर्श'
                    : 'Optimal for crop',
              ),
            if (deficit != null && deficit > 0)
              _buildInfoRow(widget.language == 'hi' ? 'कमी' : 'Deficit',
                  '${deficit.toStringAsFixed(1)}%'),
            if (suggestedDepth != null)
              _buildInfoRowWithTooltip(
                widget.language == 'hi' ? 'सुझाई गई गहराई' : 'Suggested Depth',
                '${suggestedDepth.toStringAsFixed(0)} mm',
                widget.language == 'hi'
                    ? 'प्रति m² पानी की गहराई'
                    : 'Water depth per m²',
              ),
            if (suggestedDuration != null)
              _buildInfoRowWithTooltip(
                widget.language == 'hi'
                    ? 'सुझाई गई अवधि'
                    : 'Suggested Duration',
                '${(suggestedDuration / 60).toStringAsFixed(1)} hours',
                widget.language == 'hi'
                    ? 'ड्रिप सिस्टम के लिए'
                    : 'For drip irrigation',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCropInfoCard() {
    if (_decisionData == null) return const SizedBox.shrink();

    final cropType = _decisionData!['cropType'];
    final growthStage = _decisionData!['growthStage'];
    final fieldName = _decisionData!['fieldName'];

    if (cropType == null) return const SizedBox.shrink();

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
                const Icon(Icons.agriculture, color: Color(0xFF4CAF50)),
                const SizedBox(width: 8),
                Text(widget.language == 'hi' ? 'फसल की जानकारी' : 'Crop Info',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            if (fieldName != null)
              _buildInfoRow(
                  widget.language == 'hi' ? 'खेत' : 'Field', fieldName),
            _buildInfoRow(widget.language == 'hi' ? 'फसल' : 'Crop',
                _getCropName(cropType)),
            if (growthStage != null)
              _buildInfoRow(
                widget.language == 'hi' ? 'विकास चरण' : 'Growth Stage',
                growthStage.toString().replaceAll('_', ' '),
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
                const Icon(Icons.sensors, color: Color(0xFF4CAF50)),
                const SizedBox(width: 8),
                Text(widget.language == 'hi' ? 'सेंसर डेटा' : 'Sensor Data',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            _buildInfoRow(widget.language == 'hi' ? 'खेत ID' : 'Field ID',
                'Field ${widget.fieldId}'),
            _buildInfoRow(widget.language == 'hi' ? 'स्थिति' : 'Status',
                widget.language == 'hi' ? 'सक्रिय' : 'Active'),
            _buildInfoRow(
                widget.language == 'hi' ? 'अंतिम अपडेट' : 'Last Update',
                DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now())),
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
                const Icon(Icons.info_outline, color: Color(0xFF2196F3)),
                const SizedBox(width: 8),
                Text(
                    widget.language == 'hi'
                        ? 'तात्कालिकता गाइड'
                        : 'Urgency Guide',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            _buildUrgencyItem(
                'CRITICAL',
                widget.language == 'hi'
                    ? 'तुरंत सिंचाई करें'
                    : 'Irrigate immediately',
                const Color(0xFFD32F2F)),
            _buildUrgencyItem(
                'HIGH',
                widget.language == 'hi' ? '24 घंटे के भीतर' : 'Within 24 hours',
                const Color(0xFFFF9800)),
            _buildUrgencyItem(
                'MODERATE',
                widget.language == 'hi' ? '2-3 दिनों में' : 'Within 2-3 days',
                const Color(0xFF2196F3)),
            _buildUrgencyItem(
                'LOW',
                widget.language == 'hi'
                    ? 'अगले सप्ताह तक प्रतीक्षा करें'
                    : 'Can wait until next week',
                const Color(0xFF9C27B0)),
            _buildUrgencyItem(
                'NONE',
                widget.language == 'hi'
                    ? 'कोई सिंचाई की जरूरत नहीं'
                    : 'No irrigation needed',
                const Color(0xFF4CAF50)),
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
              decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(level,
                    style:
                        TextStyle(fontWeight: FontWeight.bold, color: color)),
                Text(description,
                    style:
                        const TextStyle(fontSize: 12, color: Colors.black54)),
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

  Widget _buildInfoRowWithTooltip(String label, String value, String tooltip) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Text(label, style: const TextStyle(color: Colors.black54)),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () => _showInfoDialog(label, tooltip),
                child: const Icon(Icons.info_outline,
                    size: 16, color: Colors.grey),
              ),
            ],
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showInfoDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
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
