// #include <SPI.h>
// #include <LoRa.h>
// #include <WiFi.h>
// #include <HTTPClient.h>
// #include <ArduinoJson.h>

// // LoRa pins
// #define SS 5
// #define RST 14
// #define DIO0 2
// #define BAND 868E6

// // WiFi credentials
// const char *ssid = "YOUR_WIFI_SSID";
// const char *password = "YOUR_WIFI_PASSWORD";

// // Backend server
// const char *serverUrl = "http://192.168.1.100:3000/api/sensor/aggregated";

// // Node configuration (manually set based on your deployment)
// const int TOTAL_NODES = 4;
// const float NODE_DEPTHS[4] = {40, 40, 40, 50};          // cm
// const float NODE_DISTANCES[4] = {7.1, 20.6, 7.1, 25.5}; // meters from gateway

// // Data collection window
// const unsigned long COLLECTION_WINDOW = 30000; // 30 seconds to collect from all nodes

// // Storage for received data
// struct NodeData
// {
//     int nodeId;
//     int moisture;
//     int temperature;
//     int rssi;
//     int batteryLevel;
//     bool received;
//     unsigned long receivedTime;
// };

// NodeData nodeDataBuffer[TOTAL_NODES];

// void setup()
// {
//     Serial.begin(115200);
//     while (!Serial)
//         ;

//     Serial.println("Initializing LoRa Gateway (Aggregated Mode)...");

//     // Initialize node buffer
//     for (int i = 0; i < TOTAL_NODES; i++)
//     {
//         nodeDataBuffer[i].nodeId = i + 1;
//         nodeDataBuffer[i].received = false;
//     }

//     // Connect to WiFi
//     WiFi.begin(ssid, password);
//     Serial.print("Connecting to WiFi");
//     while (WiFi.status() != WL_CONNECTED)
//     {
//         delay(500);
//         Serial.print(".");
//     }
//     Serial.println();
//     Serial.println("WiFi Connected!");
//     Serial.println("IP Address: " + WiFi.localIP().toString());

//     // Initialize LoRa
//     LoRa.setPins(SS, RST, DIO0);
//     while (!LoRa.begin(BAND))
//     {
//         Serial.println("LoRa initialization failed. Retrying...");
//         delay(500);
//     }

//     LoRa.setSyncWord(0xF3);
//     LoRa.setSpreadingFactor(10);
//     LoRa.setSignalBandwidth(125E3);
//     LoRa.setCodingRate4(5);

//     Serial.println("LoRa Gateway Initialized");
//     Serial.println("Listening for sensor data from 4 nodes...");
//     Serial.println();
// }

// void loop()
// {
//     // Check for incoming LoRa packets
//     int packetSize = LoRa.parsePacket();

//     if (packetSize)
//     {
//         String receivedData = "";

//         while (LoRa.available())
//         {
//             receivedData += (char)LoRa.read();
//         }

//         int rssi = LoRa.packetRssi();

//         Serial.println("Received: " + receivedData);
//         Serial.println("RSSI: " + String(rssi) + " dBm");

//         // Parse: "NodeID,Moisture,Temperature,Battery"
//         int comma1 = receivedData.indexOf(',');
//         int comma2 = receivedData.indexOf(',', comma1 + 1);
//         int comma3 = receivedData.indexOf(',', comma2 + 1);

//         if (comma1 > 0 && comma2 > 0 && comma3 > 0)
//         {
//             int nodeId = receivedData.substring(0, comma1).toInt();
//             int moisture = receivedData.substring(comma1 + 1, comma2).toInt();
//             int temperature = receivedData.substring(comma2 + 1, comma3).toInt();
//             int battery = receivedData.substring(comma3 + 1).toInt();

//             // Store in buffer
//             if (nodeId >= 1 && nodeId <= TOTAL_NODES)
//             {
//                 int index = nodeId - 1;
//                 nodeDataBuffer[index].moisture = moisture;
//                 nodeDataBuffer[index].temperature = temperature;
//                 nodeDataBuffer[index].rssi = rssi;
//                 nodeDataBuffer[index].batteryLevel = battery;
//                 nodeDataBuffer[index].received = true;
//                 nodeDataBuffer[index].receivedTime = millis();

//                 Serial.println("Stored data for Node " + String(nodeId));
//             }
//         }

//         Serial.println();
//     }

//     // Check if collection window elapsed
//     static unsigned long lastSendTime = 0;
//     unsigned long currentTime = millis();

//     if (currentTime - lastSendTime >= COLLECTION_WINDOW)
//     {
//         // Check how many nodes responded
//         int receivedCount = 0;
//         for (int i = 0; i < TOTAL_NODES; i++)
//         {
//             if (nodeDataBuffer[i].received)
//             {
//                 receivedCount++;
//             }
//         }

//         if (receivedCount > 0)
//         {
//             Serial.println("Collection window complete. Received from " + String(receivedCount) + " nodes");
//             sendAggregatedData();
//         }
//         else
//         {
//             Serial.println("No data received in collection window");
//         }

//         // Reset buffer
//         for (int i = 0; i < TOTAL_NODES; i++)
//         {
//             nodeDataBuffer[i].received = false;
//         }

//         lastSendTime = currentTime;
//     }
// }

// void sendAggregatedData()
// {
//     if (WiFi.status() != WL_CONNECTED)
//     {
//         Serial.println("WiFi not connected. Reconnecting...");
//         WiFi.reconnect();
//         return;
//     }

//     HTTPClient http;
//     http.begin(serverUrl);
//     http.addHeader("Content-Type", "application/json");

//     // Create JSON document
//     StaticJsonDocument<2048> doc;
//     doc["timestamp"] = getTimestamp();

//     JsonArray nodes = doc.createNestedArray("nodes");

//     for (int i = 0; i < TOTAL_NODES; i++)
//     {
//         if (nodeDataBuffer[i].received)
//         {
//             JsonObject node = nodes.createNestedObject();
//             node["nodeId"] = nodeDataBuffer[i].nodeId;
//             node["moisture"] = nodeDataBuffer[i].moisture;
//             node["temperature"] = nodeDataBuffer[i].temperature;
//             node["rssi"] = nodeDataBuffer[i].rssi;
//             node["batteryLevel"] = nodeDataBuffer[i].batteryLevel;
//             node["depth"] = NODE_DEPTHS[i];
//             node["distance"] = NODE_DISTANCES[i];
//         }
//     }

//     String jsonPayload;
//     serializeJson(doc, jsonPayload);

//     Serial.println("Sending aggregated data:");
//     Serial.println(jsonPayload);

//     int httpCode = http.POST(jsonPayload);

//     if (httpCode > 0)
//     {
//         Serial.println("Backend response: " + String(httpCode));
//         if (httpCode == 200)
//         {
//             String response = http.getString();
//             Serial.println("Response: " + response);
//         }
//     }
//     else
//     {
//         Serial.println("Error sending to backend: " + http.errorToString(httpCode));
//     }

//     http.end();
// }

// String getTimestamp()
// {
//     // Simple ISO timestamp (you can use NTP for real time)
//     unsigned long seconds = millis() / 1000;
//     return "2025-11-26T" + String(seconds % 86400) + "Z";
// }
