import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/app_config.dart';

class ApiTestScreen extends StatefulWidget {
  @override
  _ApiTestScreenState createState() => _ApiTestScreenState();
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
      print('🔍 Backend URL: ${AppConfig.backendUrl}');
      
      // Test 1: Fetch latest data (legacy endpoint)
      final data = await ApiService.fetchLatestData();
      
      print('✅ Data fetched: ${data.length} sensors');
      
      if (data.isEmpty) {
        setState(() {
          result = '''
⚠️ NO DATA FOUND

Backend URL: ${AppConfig.backendUrl}
Response: Empty array []

Possible issues:
1. No sensor data in database
2. Backend /api/data/latest not working
3. Wrong backend URL

Try sending sensor data:
curl -X POST http://localhost:3000/api/sensor \\
  -H "Content-Type: application/json" \\
  -d '{"nodeId":1,"moisture":350,"temperature":21.0,"rssi":-65}'
          ''';
          isLoading = false;
        });
        return;
      }
      
      setState(() {
        result = '''
✅ SUCCESS!

Backend: ${AppConfig.backendUrl}
Sensors found: ${data.length}

--- Sensor Data ---
${data.map((s) => '''
Node ${s.nodeId}:
  Moisture: ${s.moisture} SMU
  Temperature: ${s.temperature}°C
  Best Crop: ${s.bestCrop}
  Confidence: ${s.cropConfidence.toStringAsFixed(1)}%
  Status: ${s.soilStatus}
  Advice: ${s.irrigationAdvice}
''').join('\n')}
        ''';
        isLoading = false;
      });
      
    } catch (e) {
      print('❌ Error: $e');
      setState(() {
        result = '''
❌ ERROR

Backend URL: ${AppConfig.backendUrl}
Error: $e

Troubleshooting:
1. Check if backend is running:
   curl http://localhost:3000/api/health

2. Check .env file:
   cat mobile_app/.env

3. Verify backend has data:
   curl http://localhost:3000/api/data/latest

4. If using desktop app, URL should be:
   http://localhost:3000
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
