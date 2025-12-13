import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/gdd_status.dart';
import '../models/irrigation_decision.dart';
import '../services/api_service.dart';

class IrrigationAdviceScreen extends StatefulWidget {
  final int fieldId; // This is nodeId in backend
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

  IrrigationDecision? _decision;
  GDDStatus? _gddStatus;
  Map<String, dynamic>? _weatherData;

  bool get _isHindi => widget.language == 'hi';

  @override
  void initState() {
    super.initState();
    _fetchAdvice();
  }

  void _setStateIfMounted(VoidCallback fn) {
    if (!mounted) return;
    setState(fn);
  }

  Future<GDDStatus?> _safeGetGddStatus(int nodeId) async {
    try {
      return await ApiService.getGDDStatus(nodeId);
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> _safeGetWeather(int nodeId) async {
    try {
      final w = await ApiService.getWeatherForecast(nodeId);
      return w.isNotEmpty ? w : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _fetchAdvice() async {
    _setStateIfMounted(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Fetch optional endpoints in parallel with the required decision.
      final results = await Future.wait<Object?>(<Future<Object?>>[
        ApiService.getIrrigationDecision(widget.fieldId), // required
        _safeGetGddStatus(widget.fieldId), // optional
        _safeGetWeather(widget.fieldId), // optional
      ]);

      final decision = results[0] as IrrigationDecision;
      final gdd = results[1] as GDDStatus?;
      final weather = results[2] as Map<String, dynamic>?;

      _setStateIfMounted(() {
        _decision = decision;
        _gddStatus = gdd;
        _weatherData = weather;
        _isLoading = false;
      });
    } catch (e) {
      _setStateIfMounted(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _isHindi ? 'सिंचाई सलाह' : 'Irrigation Advice';

    return Scaffold(
      appBar: AppBar(
        title: Text(title, style: const TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF4CAF50),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchAdvice),
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
            Text(_errorMessage ?? '', textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              _isHindi
                  ? 'सुझाव: पहले "फसल पुष्टि" करें'
                  : 'Hint: Confirm crop first',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchAdvice,
              child: Text(_isHindi ? 'पुनः प्रयास करें' : 'Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_decision == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_isHindi ? 'डेटा उपलब्ध नहीं है' : 'No data available'),
        ),
      );
    }

    final reason = _isHindi ? _decision!.reasonHi : _decision!.reasonEn;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDecisionCard(_decision!, reason),
          const SizedBox(height: 16),
          if (_weatherData != null) _buildWeatherCard(),
          if (_weatherData != null) const SizedBox(height: 16),
          _buildIrrigationDetailsCard(_decision!),
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

  Widget _buildDecisionCard(IrrigationDecision decision, String reason) {
    final urgency = decision.urgency;
    final urgencyScore = decision.urgencyScore;

    Color color;
    IconData icon;
    String title;

    switch (urgency) {
      case 'CRITICAL':
        color = const Color(0xFFD32F2F);
        icon = Icons.warning_rounded;
        title = _isHindi ? 'तुरंत सिंचाई करें!' : 'IRRIGATE NOW!';
        break;
      case 'HIGH':
        color = const Color(0xFFFF9800);
        icon = Icons.water_drop;
        title = _isHindi ? 'जल्द सिंचाई करें' : 'IRRIGATE SOON';
        break;
      case 'MODERATE':
        color = const Color(0xFF2196F3);
        icon = Icons.water;
        title = _isHindi ? 'सिंचाई की योजना बनाएं' : 'PLAN IRRIGATION';
        break;
      case 'LOW':
        color = const Color(0xFF9C27B0);
        icon = Icons.check_circle_outline;
        title = _isHindi ? 'अभी आवश्यकता नहीं' : 'LOW URGENCY';
        break;
      case 'NONE':
      default:
        color = const Color(0xFF4CAF50);
        icon = Icons.check_circle;
        title = _isHindi ? 'सिंचाई न करें' : 'SKIP IRRIGATION';
        break;
    }

    final decisionLabel = decision.decisionLabel(isHindi: _isHindi);

    return Card(
      color: color.withOpacity(0.10),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          children: [
            Icon(icon, size: 78, color: color),
            const SizedBox(height: 16),
            Text(
              title,
              style: TextStyle(
                  fontSize: 26, fontWeight: FontWeight.bold, color: color),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              alignment: WrapAlignment.center,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                      color: color, borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    urgency,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    decisionLabel,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              reason.isEmpty
                  ? (_isHindi
                      ? 'कोई सुझाव उपलब्ध नहीं है'
                      : 'No recommendation available')
                  : reason,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, height: 1.4),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.speed, size: 18, color: color),
                const SizedBox(width: 6),
                Text(
                  '${urgencyScore.toStringAsFixed(0)}/100 ${_isHindi ? 'स्कोर' : 'score'}',
                  style: TextStyle(
                      color: color, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            if (decision.scoreBasis != null &&
                decision.scoreBasis!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                decision.scoreBasis!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWeatherCard() {
    final forecastRaw = _weatherData?['forecast'];
    if (forecastRaw is! List) return const SizedBox.shrink();

    final List<dynamic> forecast = forecastRaw;

    double totalRain = 0.0;
    for (final day in forecast) {
      final m = _asMap(day);
      if (m == null) continue;
      totalRain += _asDouble(m['precipitation'] ?? m['rain'], fallback: 0.0);
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              const Icon(Icons.wb_sunny, color: Color(0xFFFF9800)),
              const SizedBox(width: 8),
              Text(
                _isHindi ? '5-दिन मौसम पूर्वानुमान' : '5-Day Weather Forecast',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Divider(),
          ...forecast.take(5).map((d) {
            final m = _asMap(d);
            if (m == null) return const SizedBox.shrink();
            return _buildWeatherRow(m);
          }),
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
                      _isHindi
                          ? '${totalRain.toStringAsFixed(0)}mm बारिश अपेक्षित - सिंचाई स्थगित करें'
                          : '${totalRain.toStringAsFixed(0)}mm rain expected - defer irrigation',
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _buildWeatherRow(Map<String, dynamic> day) {
    final date =
        DateTime.tryParse((day['date'] ?? '').toString()) ?? DateTime.now();

    final temp = _asDouble(
      day['tempAvg'] ?? day['temperatureAvg'] ?? day['temp'],
      fallback: 0.0,
    );

    final rain = _asDouble(
      day['precipitation'] ?? day['rain'],
      fallback: 0.0,
    );

    String icon = '☀️';
    if (rain > 10) {
      icon = '🌧️';
    } else if (rain > 2) {
      icon = '⛅';
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
              Text(icon, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text(
                '${temp.toStringAsFixed(0)}°C',
                style:
                    const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 16),
              Text(
                'Rain ${rain.toStringAsFixed(0)}mm',
                style: TextStyle(
                  fontSize: 13,
                  color: rain > 5 ? const Color(0xFF2196F3) : Colors.grey,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIrrigationDetailsCard(IrrigationDecision decision) {
    final rawDeficit = (decision.targetVWC - decision.currentVWC);
    final deficit = rawDeficit > 0 ? rawDeficit : 0.0;

    final deficitPctFromApi = decision.deficitPctOfTarget;
    final fallbackPct = decision.targetVWC <= 0
        ? 0.0
        : ((deficit / decision.targetVWC) * 100.0);
    final deficitPct = (deficitPctFromApi == null || deficitPctFromApi.isNaN)
        ? fallbackPct
        : deficitPctFromApi;

    // User-facing duration formatting (h + min).
    String _formatDuration(int minutes) {
      if (minutes <= 0) return _isHindi ? 'कोई सिंचाई नहीं' : 'No irrigation';
      final h = minutes ~/ 60;
      final m = minutes % 60;
      if (h == 0) return '$m min';
      if (m == 0) return '${h}h';
      return '${h}h ${m}min';
    }

    // Application rate explanation if available.
    String? rateText;
    if (decision.applicationRateMmPerHour != null &&
        !decision.applicationRateMmPerHour!.isNaN &&
        decision.applicationRateMmPerHour! > 0) {
      final r = decision.applicationRateMmPerHour!;
      rateText = _isHindi
          ? 'अनुमानित दर: ${r.toStringAsFixed(1)} mm/घंटा (प्रति m² पानी की गहराई)'
          : 'Assumed rate: ${r.toStringAsFixed(1)} mm/hour (water depth per m²)';
    }

    final hasRun = decision.hasIrrigationRun;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              const Icon(Icons.water_drop, color: Color(0xFF2196F3)),
              const SizedBox(width: 8),
              Text(
                _isHindi ? 'सिंचाई विवरण' : 'Irrigation Details',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Divider(),
          _buildInfoRowWithTooltip(
            _isHindi ? 'वर्तमान नमी (VWC)' : 'Current moisture (VWC)',
            '${decision.currentVWC.toStringAsFixed(1)}%',
            _isHindi ? 'सेंसर द्वारा मापी गई' : 'Measured by sensor',
          ),
          _buildInfoRowWithTooltip(
            _isHindi ? 'लक्ष्य नमी (VWC)' : 'Target moisture (VWC)',
            '${decision.targetVWC.toStringAsFixed(1)}%',
            _isHindi ? 'फसल के लिए आदर्श' : 'Optimal for crop',
          ),
          if (deficit > 0) ...[
            _buildInfoRow(
              _isHindi ? 'कमी (VWC पॉइंट)' : 'Deficit (VWC points)',
              '${deficit.toStringAsFixed(1)}%',
            ),
            _buildInfoRow(
              _isHindi ? 'कमी (लक्ष्य के सापेक्ष)' : 'Deficit (of target)',
              '${deficitPct.clamp(0.0, 100.0).toStringAsFixed(0)}%',
            ),
          ] else
            _buildInfoRow(
              _isHindi ? 'कमी' : 'Deficit',
              _isHindi ? 'कोई कमी नहीं' : 'No deficit',
            ),
          _buildInfoRowWithTooltip(
            _isHindi ? 'सुझाई गई गहराई' : 'Suggested depth',
            hasRun
                ? '${decision.suggestedDepthMm.toStringAsFixed(1)} mm (≈ ${decision.suggestedDepthMm.toStringAsFixed(1)} L/m²)'
                : (_isHindi ? 'कोई सिंचाई नहीं' : 'No irrigation'),
            _isHindi
                ? 'यह प्रति वर्ग मीटर पानी की गहराई है। 1 mm ≈ 1 लीटर/m².'
                : 'Water depth to apply per square metre. 1 mm ≈ 1 litre/m².',
          ),
          _buildInfoRowWithTooltip(
            _isHindi ? 'सुझाई गई अवधि' : 'Suggested duration',
            hasRun
                ? _formatDuration(decision.suggestedDurationMin)
                : (_isHindi ? 'कोई सिंचाई नहीं' : 'No irrigation'),
            _isHindi
                ? 'अनुमानित सिंचाई समय। गहराई और लागू दर (mm/घंटा) पर आधारित।'
                : 'Estimated irrigation time, based on depth and application rate (mm/hour).',
          ),
          if (rateText != null) ...[
            const SizedBox(height: 4),
            Text(
              rateText,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
          if (decision.recommendedMethod != null &&
              decision.recommendedMethod!.isNotEmpty)
            _buildInfoRow(
              _isHindi ? 'सुझाई गई विधि' : 'Recommended method',
              decision.recommendedMethod!,
            ),
          _buildInfoRow(
            _isHindi ? 'अगला चेक' : 'Next check',
            '${decision.nextCheckHours}h',
          ),
        ]),
      ),
    );
  }

  Widget _buildCropInfoCard() {
    final fieldCfg = _gddStatus?.fieldConfig;
    final gdd = _gddStatus?.gddData;

    // If crop not confirmed, backend may not provide GDD status -> hide card.
    if (fieldCfg == null && gdd == null) return const SizedBox.shrink();

    final cropType = fieldCfg?.cropType;
    final fieldName = fieldCfg?.fieldName;
    final growthStage = fieldCfg?.currentGrowthStage ?? gdd?.growthStage;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              const Icon(Icons.agriculture, color: Color(0xFF4CAF50)),
              const SizedBox(width: 8),
              Text(
                _isHindi ? 'फसल की जानकारी' : 'Crop Info',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Divider(),
          if (fieldName != null)
            _buildInfoRow(_isHindi ? 'खेत' : 'Field', fieldName),
          if (cropType != null)
            _buildInfoRow(_isHindi ? 'फसल' : 'Crop', _getCropName(cropType)),
          if (growthStage != null)
            _buildInfoRow(
              _isHindi ? 'विकास चरण' : 'Growth Stage',
              growthStage.replaceAll('_', ' '),
            ),
          if (gdd != null) ...[
            _buildInfoRow(
              _isHindi ? 'GDD प्रगति' : 'GDD progress',
              '${gdd.progressPercent.toStringAsFixed(1)}%',
            ),
            _buildInfoRow(
              _isHindi ? 'कटाई तक दिन (अनुमान)' : 'Days to harvest (est.)',
              (gdd.estimatedDaysToHarvest == null)
                  ? (_isHindi ? 'उपलब्ध नहीं' : 'N/A')
                  : gdd.estimatedDaysToHarvest!.toStringAsFixed(0),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _buildSensorInfo() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              const Icon(Icons.sensors, color: Color(0xFF4CAF50)),
              const SizedBox(width: 8),
              Text(
                _isHindi ? 'नोड डेटा' : 'Node Data',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Divider(),
          _buildInfoRow(
              _isHindi ? 'नोड ID' : 'Node ID', widget.fieldId.toString()),
          _buildInfoRow(
              _isHindi ? 'स्थिति' : 'Status', _isHindi ? 'सक्रिय' : 'Active'),
          _buildInfoRow(
            _isHindi ? 'अंतिम अपडेट' : 'Last Update',
            DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now()),
          ),
        ]),
      ),
    );
  }

  Widget _buildUrgencyGuide() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              const Icon(Icons.info_outline, color: Color(0xFF2196F3)),
              const SizedBox(width: 8),
              Text(
                _isHindi ? 'तात्कालिकता गाइड' : 'Urgency Guide',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Divider(),
          _buildUrgencyItem(
              'CRITICAL',
              _isHindi ? 'तुरंत सिंचाई करें' : 'Irrigate immediately',
              const Color(0xFFD32F2F)),
          _buildUrgencyItem(
              'HIGH',
              _isHindi ? '24 घंटे के भीतर' : 'Within 24 hours',
              const Color(0xFFFF9800)),
          _buildUrgencyItem(
              'MODERATE',
              _isHindi ? '2-3 दिनों में' : 'Within 2-3 days',
              const Color(0xFF2196F3)),
          _buildUrgencyItem(
              'LOW',
              _isHindi ? 'प्रतीक्षा कर सकते हैं' : 'Can wait',
              const Color(0xFF9C27B0)),
          _buildUrgencyItem(
              'NONE',
              _isHindi ? 'सिंचाई की जरूरत नहीं' : 'No irrigation needed',
              const Color(0xFF4CAF50)),
        ]),
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
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(level,
                  style: TextStyle(fontWeight: FontWeight.bold, color: color)),
              Text(description,
                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ]),
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
          Flexible(
              child:
                  Text(label, style: const TextStyle(color: Colors.black54))),
          const SizedBox(width: 12),
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
          Flexible(
            child: Row(
              children: [
                Flexible(
                    child: Text(label,
                        style: const TextStyle(color: Colors.black54))),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => _showInfoDialog(label, tooltip),
                  child: const Icon(Icons.info_outline,
                      size: 16, color: Colors.grey),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showInfoDialog(String title, String message) {
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }

  String _getCropName(String crop) {
    final crops = <String, String>{
      'wheat': _isHindi ? 'गेहूं' : 'Wheat',
      'rice': _isHindi ? 'चावल' : 'Rice',
      'maize': _isHindi ? 'मक्का' : 'Maize',
      'mustard': _isHindi ? 'सरसों' : 'Mustard',
      'chickpea': _isHindi ? 'चना' : 'Chickpea',
      'sugarcane': _isHindi ? 'गन्ना' : 'Sugarcane',
      'potato': _isHindi ? 'आलू' : 'Potato',
      'lentil': _isHindi ? 'मसूर' : 'Lentil',
      'pea': _isHindi ? 'मटर' : 'Pea',
    };
    return crops[crop.toLowerCase()] ?? crop;
  }

  Map<String, dynamic>? _asMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }

  double _asDouble(dynamic v, {required double fallback}) {
    if (v == null) return fallback;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim()) ?? fallback;
    return fallback;
  }
}
