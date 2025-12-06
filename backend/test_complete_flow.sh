#!/bin/bash
BASE_URL="http://localhost:3000"

echo "🌾 Complete WUSN System Test - Rabi Season"
echo "=========================================="

# Test 1: Configure Chickpea Field
echo -e "\n### Step 1: Configure Field (Chickpea) ###"
curl -s -X POST $BASE_URL/api/fields/configure \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": 1,
    "fieldName": "Test Rabi Field",
    "cropType": "chickpea",
    "sowingDate": "2024-11-20",
    "soilTexture": "SANDY_LOAM",
    "latitude": 26.8467,
    "longitude": 80.9462
  }' | jq '{status, message, fieldConfig: {cropType, baseTemperature, expectedGDDTotal}}'

sleep 2

# Test 2: Send Sensor Data (Optimal Chickpea Moisture)
echo -e "\n### Step 2: Send Sensor Data (35% VWC, 21°C) ###"
curl -s -X POST $BASE_URL/api/sensor \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": 1,
    "moisture": 350,
    "temperature": 21.0,
    "rssi": -65
  }' | jq '{status}'

sleep 2

# Test 3: Get Crop Recommendation
echo -e "\n### Step 3: Crop Recommendation ###"
curl -s -X GET $BASE_URL/api/crops/1/recommend | jq '{
  status,
  bestCrop,
  bestCropHindi,
  confidence,
  summary,
  topCrops: [.topCrops[] | {cropName, suitability, reason}] | .[0:3]
}'

sleep 1

# Test 4: Get Irrigation Recommendation
echo -e "\n### Step 4: Irrigation Recommendation ###"
curl -s -X GET $BASE_URL/api/irrigation/1/recommend | jq '{
  status,
  decision: {
    shouldIrrigate: .decision.shouldIrrigate,
    urgency: .decision.urgency,
    reason: .decision.reason,
    currentVWC: .decision.currentVWC,
    targetVWC: .decision.targetVWC,
    estimatedWaterNeeded: .decision.estimatedWaterNeeded,
    recommendedMethod: .decision.recommendedMethod,
    confidence: .decision.confidence,
    growthStage: .decision.growthStage
  }
}'

sleep 1

# Test 5: Get GDD Status
echo -e "\n### Step 5: GDD Status ###"
curl -s -X GET $BASE_URL/api/gdd/1/status | jq '{
  status,
  nodeId,
  fieldConfig: {
    cropType: .fieldConfig.cropType,
    sowingDate: .fieldConfig.sowingDate,
    baseTemperature: .fieldConfig.baseTemperature
  },
  gddData: {
    dailyGDD: .gddData.dailyGDD,
    cumulativeGDD: .gddData.cumulativeGDD,
    growthStage: .gddData.growthStage,
    progressPercentage: .gddData.progressPercentage,
    daysElapsed: .gddData.daysElapsed
  }
}'

sleep 1

# Test 6: Critical Irrigation Scenario
echo -e "\n### Step 6: Critical Dry Soil Test ###"
curl -s -X POST $BASE_URL/api/sensor \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": 1,
    "moisture": 150,
    "temperature": 22.0,
    "rssi": -65
  }' | jq '{status}'

sleep 2

curl -s -X GET $BASE_URL/api/irrigation/1/recommend | jq '{
  shouldIrrigate: .decision.shouldIrrigate,
  urgency: .decision.urgency,
  reason: .decision.reason,
  estimatedWaterNeeded: .decision.estimatedWaterNeeded
}'

# Test 7: Record Irrigation
echo -e "\n### Step 7: Record Irrigation Action ###"
curl -s -X POST $BASE_URL/api/irrigation/1/record \
  -H "Content-Type: application/json" \
  -d '{"waterAppliedMm": 25}' | jq '{status, message}'

# Test 8: Get Weather
echo -e "\n### Step 8: Weather Forecast (Lucknow) ###"
curl -s -X GET "$BASE_URL/api/weather/forecast?lat=26.8467&lon=80.9462" | jq '{
  status,
  location,
  current: .data.current,
  forecast: .data.forecast_7day[0:3]
}'

echo -e "\n\n✅ Complete system test finished!"
echo -e "\n📱 Now test on your Flutter app:"
echo "1. Open app"
echo "2. Go to Dashboard"
echo "3. You should see:"
echo "   - Chickpea as recommended crop"
echo "   - Irrigation recommendation"
echo "   - GDD progress bar"
echo "   - Growth stage: INITIAL or DEVELOPMENT"

