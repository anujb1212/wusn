// #include <SPI.h>
// #include <LoRa.h>

// // LoRa pins
// #define SS 5
// #define RST 14
// #define DIO0 2
// #define BAND 868E6

// // Sensor pins
// #define MOISTURE_PIN 34
// #define TEMP_PIN 4
// #define BATTERY_PIN 35  // ADC pin for battery voltage

// // IMPORTANT: Change this for each node (1, 2, 3, or 4)
// #define NODE_ID 1

// // Reading interval
// #define READING_INTERVAL 600000  // 10 minutes in production
// // #define READING_INTERVAL 10000  // 10 seconds for testing

// // Battery calibration
// #define BATTERY_MAX_VOLTAGE 4.2  // Fully charged Li-ion
// #define BATTERY_MIN_VOLTAGE 3.0  // Empty Li-ion

// void setup() {
//     Serial.begin(115200);
//     while (!Serial);

//     Serial.println("Initializing Sensor Node " + String(NODE_ID));

//     // Initialize LoRa
//     LoRa.setPins(SS, RST, DIO0);
//     while (!LoRa.begin(BAND)) {
//         Serial.println("LoRa initialization failed. Retrying...");
//         delay(500);
//     }

//     LoRa.setSyncWord(0xF3);
//     LoRa.setSpreadingFactor(10);
//     LoRa.setSignalBandwidth(125E3);
//     LoRa.setCodingRate4(5);
//     LoRa.setTxPower(20);
//     LoRa.enableCrc();

//     Serial.println("LoRa Sender Node " + String(NODE_ID) + " Initialized");
// }

// void loop() {
//     // Read moisture
//     int moistureRaw = analogRead(MOISTURE_PIN);
//     int moisture = map(moistureRaw, 0, 4095, 0, 1000);

//     // Read temperature
//     int temperature = readTemperature();

//     // Read battery level
//     int batteryLevel = readBatteryLevel();

//     // Create packet: "NodeID,Moisture,Temperature,Battery"
//     String packet = String(NODE_ID) + "," +
//                     String(moisture) + "," +
//                     String(temperature) + "," +
//                     String(batteryLevel);

//     // Send via LoRa
//     LoRa.beginPacket();
//     LoRa.print(packet);
//     LoRa.endPacket();

//     // Debug output
//     Serial.println("Sent: " + packet);
//     Serial.println("  Node: " + String(NODE_ID));
//     Serial.println("  Moisture: " + String(moisture) + " SMU");
//     Serial.println("  Temperature: " + String(temperature) + " C");
//     Serial.println("  Battery: " + String(batteryLevel) + "%");
//     Serial.println();

//     // Wait before next reading
//     delay(READING_INTERVAL);
// }

// int readTemperature() {
//     // TODO: Implement DS18B20 OneWire protocol
//     // For testing, return dummy value
//     int tempRaw = analogRead(TEMP_PIN);
//     return map(tempRaw, 0, 4095, 15, 35);
// }

// int readBatteryLevel() {
//     // Read battery voltage through voltage divider
//     int adcValue = analogRead(BATTERY_PIN);

//     // Convert ADC to voltage (ESP32 ADC: 0-4095 = 0-3.3V)
//     // If using voltage divider (R1=100k, R2=100k), multiply by 2
//     float voltage = (adcValue / 4095.0) * 3.3 * 2.0;

//     // Convert voltage to percentage
//     float percentage = ((voltage - BATTERY_MIN_VOLTAGE) /
//                        (BATTERY_MAX_VOLTAGE - BATTERY_MIN_VOLTAGE)) * 100.0;

//     // Clamp to 0-100 range
//     if (percentage > 100) percentage = 100;
//     if (percentage < 0) percentage = 0;

//     return (int)percentage;
// }
