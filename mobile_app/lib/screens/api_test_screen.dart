import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../services/api_service.dart';

import '../models/field_model.dart';
import '../models/sensor_data.dart';
import '../models/irrigation_decision.dart';
import '../models/gdd_status.dart';
import '../models/crop_recommendation.dart';

class ApiTestScreen extends StatefulWidget {
  const ApiTestScreen({super.key});

  @override
  State<ApiTestScreen> createState() => _ApiTestScreenState();
}

class _ApiTestScreenState extends State<ApiTestScreen> {
  String result = 'Press button to test API';
  bool isLoading = false;

  Future<void> testApi() async {
    setState(() {
      isLoading = true;
      result = 'Testing...';
    });

    try {
      final sb = StringBuffer();
      sb.writeln('🔍 Backend URL: ${AppConfig.backendUrl}');
      sb.writeln('');

      // 1) Fields
      final List<Field> fields = await ApiService.getFields();
      sb.writeln('✅ GET /api/fields');
      sb.writeln('Fields found: ${fields.length}');
      sb.writeln('');

      if (fields.isEmpty) {
        sb.writeln('⚠️ NO FIELDS FOUND');
        sb.writeln('');
        sb.writeln('Create a field first:');
        sb.writeln('POST /api/fields');
        sb.writeln('');
        sb.writeln('Then attach a crop:');
        sb.writeln('POST /api/fields/:nodeId/crop');
        sb.writeln('');
        sb.writeln('Then add a node if required:');
        sb.writeln('POST /api/nodes');
        sb.writeln('');
        if (!mounted) return;
        setState(() {
          result = sb.toString();
          isLoading = false;
        });
        return;
      }

      // Choose first field/node (your app is single-node anyway)
      final Field field = fields.first;
      final int nodeId = field.id;

      sb.writeln('--- Using Node ---');
      sb.writeln('nodeId: $nodeId');
      sb.writeln('fieldName: ${field.fieldName}');
      sb.writeln('soilTexture: ${field.soilTexture}');
      sb.writeln('cropType: ${field.cropType ?? "null"}');
      sb.writeln(
          'sowingDate: ${field.sowingDate?.toIso8601String() ?? "null"}');
      sb.writeln('');

      // 2) Latest sensor data (hours=24 default in ApiService)
      SensorData? latest;
      try {
        latest = await ApiService.getLatestSensorData(nodeId, hours: 24);
        sb.writeln('✅ GET /api/sensors/$nodeId/latest?hours=24');
        sb.writeln('vwc: ${latest.vwc.toStringAsFixed(1)}%');
        sb.writeln('soilTemp: ${latest.soilTemp.toStringAsFixed(1)}°C');
        sb.writeln(
            'airTemp: ${latest.airTemp?.toStringAsFixed(1) ?? "null"}°C');
        sb.writeln('timestamp: ${latest.timestamp.toIso8601String()}');
        sb.writeln('');
      } catch (e) {
        sb.writeln('❌ GET /api/sensors/$nodeId/latest failed');
        sb.writeln('Error: $e');
        sb.writeln('');
      }

      // 3) Crop recommendations
      CropRecommendation? cropRec;
      try {
        cropRec = await ApiService.getCropRecommendations(nodeId);
        sb.writeln('✅ GET /api/crops/recommend/$nodeId');
        sb.writeln('Top crops: ${cropRec.topCrops.length}');
        if (cropRec.topCrops.isNotEmpty) {
          final top = cropRec.topCrops.first;
          sb.writeln(
              'Best: ${top.cropName} (score=${top.totalScore}, rank=${top.rank}, suitability=${top.suitability})');
        }
        if (cropRec.conditions.isNotEmpty) {
          sb.writeln('Conditions snapshot: ${cropRec.conditions}');
        }
        sb.writeln('');
      } catch (e) {
        sb.writeln('❌ GET /api/crops/recommend/$nodeId failed');
        sb.writeln('Error: $e');
        sb.writeln('');
      }

      // 4) GDD status
      GDDStatus? gdd;
      try {
        gdd = await ApiService.getGDDStatus(nodeId);
        sb.writeln('✅ GET /api/gdd/$nodeId/status');
        sb.writeln(
            'expectedGDDTotal: ${gdd.fieldConfig?.expectedGDDTotal?.toStringAsFixed(0) ?? "null"}');
        sb.writeln(
            'progressPercent: ${gdd.gddData?.progressPercent.toStringAsFixed(1) ?? "null"}');
        sb.writeln(
            'estimatedDaysToHarvest: ${gdd.gddData?.estimatedDaysToHarvest?.toStringAsFixed(0) ?? "null"}');
        sb.writeln(
            'growthStage: ${gdd.gddData?.growthStage ?? gdd.fieldConfig?.currentGrowthStage ?? "null"}');
        sb.writeln('');
      } catch (e) {
        sb.writeln(
            '⚠️ GET /api/gdd/$nodeId/status unavailable (often if crop not confirmed)');
        sb.writeln('Error: $e');
        sb.writeln('');
      }

      // 5) Irrigation decision
      IrrigationDecision? irrigation;
      try {
        irrigation = await ApiService.getIrrigationDecision(
          nodeId,
          // You can change these to test filtering:
          // minUrgency: 'HIGH',
          // includeNone: false,
        );
        sb.writeln('✅ GET /api/irrigation/decision/$nodeId');
        sb.writeln('decision: ${irrigation.decision}');
        sb.writeln('urgency: ${irrigation.urgency}');
        sb.writeln(
            'urgencyScore: ${irrigation.urgencyScore.toStringAsFixed(0)}/100');
        sb.writeln(
            'suggestedDepthMm: ${irrigation.suggestedDepthMm.toStringAsFixed(1)}');
        sb.writeln('suggestedDurationMin: ${irrigation.suggestedDurationMin}');
        sb.writeln('currentVWC: ${irrigation.currentVWC.toStringAsFixed(1)}%');
        sb.writeln('targetVWC: ${irrigation.targetVWC.toStringAsFixed(1)}%');
        sb.writeln('reason_en: ${irrigation.reasonEn}');
        sb.writeln('');
      } catch (e) {
        sb.writeln(
            '⚠️ GET /api/irrigation/decision/$nodeId unavailable (often if crop not confirmed)');
        sb.writeln('Error: $e');
        sb.writeln('');
      }

      // Summary
      sb.writeln('--- Summary ---');
      sb.writeln('Fields: ${fields.length}');
      sb.writeln('Latest sensor: ${latest == null ? "FAILED" : "OK"}');
      sb.writeln('Crop recs: ${cropRec == null ? "FAILED" : "OK"}');
      sb.writeln('GDD: ${gdd == null ? "N/A/FAILED" : "OK"}');
      sb.writeln('Irrigation: ${irrigation == null ? "N/A/FAILED" : "OK"}');
      sb.writeln('');
      sb.writeln('Troubleshooting:');
      sb.writeln('1) Verify backend base URL in AppConfig.backendUrl');
      sb.writeln('2) Try in browser/curl:');
      sb.writeln('   GET  ${AppConfig.backendUrl}/api/fields');
      sb.writeln('   GET  ${AppConfig.backendUrl}/api/sensors/$nodeId/latest');
      sb.writeln('   GET  ${AppConfig.backendUrl}/api/crops/recommend/$nodeId');
      sb.writeln('   GET  ${AppConfig.backendUrl}/api/gdd/$nodeId/status');
      sb.writeln(
          '   GET  ${AppConfig.backendUrl}/api/irrigation/decision/$nodeId');

      if (!mounted) return;
      setState(() {
        result = sb.toString();
        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        result = '''
❌ ERROR

Backend URL: ${AppConfig.backendUrl}
Error: $e

Troubleshooting:
1) Verify backend is reachable (base URL):
   ${AppConfig.backendUrl}

2) Try basic endpoint:
   GET ${AppConfig.backendUrl}/api/fields

3) If fields exist, test sensor endpoint:
   GET ${AppConfig.backendUrl}/api/sensors/1/latest
''';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('API Debug Test'),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Backend URL display
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.blue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Backend: ${AppConfig.backendUrl}',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Test button
            ElevatedButton.icon(
              onPressed: isLoading ? null : testApi,
              icon: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.play_arrow),
              label: Text(isLoading ? 'Testing...' : 'TEST API'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Result display
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: SingleChildScrollView(
                  child: SelectableText(
                    result,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
