#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

// LoRa pins
#define SS 5
#define RST 14
#define DIO0 2
#define BAND 868E6

// WiFi credentials - UPDATE THESE
const char *ssid = "YourWiFiName";         // Your WiFi SSID
const char *password = "YourWiFiPassword"; // Your WiFi Password

// Backend server URL - UPDATE THIS
const char *serverUrl = "http://192.168.1.100:3000/api/sensor"; // Your backend IP

void setup()
{
    Serial.begin(115200);
    while (!Serial)
        ;

    Serial.println("🌐 Initializing LoRa Gateway...");

    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.println("✅ WiFi Connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());

    // Initialize LoRa
    LoRa.setPins(SS, RST, DIO0);
    while (!LoRa.begin(BAND))
    {
        Serial.println("LoRa initialization failed. Retrying...");
        delay(500);
    }

    // LoRa configuration (must match sender)
    LoRa.setSyncWord(0xF3);
    LoRa.setSpreadingFactor(10);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);

    Serial.println("✅ LoRa Gateway Initialized");
    Serial.println("📡 Listening for sensor data...");
    Serial.println();
}

void loop()
{
    // Check for incoming LoRa packets
    int packetSize = LoRa.parsePacket();

    if (packetSize)
    {
        String receivedData = "";

        // Read packet
        while (LoRa.available())
        {
            receivedData += (char)LoRa.read();
        }

        // Get signal strength
        int rssi = LoRa.packetRssi();
        float snr = LoRa.packetSnr();

        Serial.println("📨 Received: " + receivedData);
        Serial.println("   RSSI: " + String(rssi) + " dBm");
        Serial.println("   SNR: " + String(snr) + " dB");

        // Parse data: "NodeID,CropType,Moisture,Temperature"
        int firstComma = receivedData.indexOf(',');
        int secondComma = receivedData.indexOf(',', firstComma + 1);
        int thirdComma = receivedData.indexOf(',', secondComma + 1);

        if (firstComma > 0 && secondComma > 0 && thirdComma > 0)
        {
            int nodeId = receivedData.substring(0, firstComma).toInt();
            String cropType = receivedData.substring(firstComma + 1, secondComma);
            int moisture = receivedData.substring(secondComma + 1, thirdComma).toInt();
            int temperature = receivedData.substring(thirdComma + 1).toInt();

            // Send to backend
            sendToBackend(nodeId, cropType, moisture, temperature);
        }
        else
        {
            Serial.println("⚠️ Invalid data format");
        }

        Serial.println();
    }
}

void sendToBackend(int nodeId, String cropType, int moisture, int temperature)
{
    if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Create JSON payload
        String jsonPayload = "{\"nodeId\":" + String(nodeId) +
                             ",\"cropType\":\"" + cropType + "\"" +
                             ",\"moisture\":" + String(moisture) +
                             ",\"temperature\":" + String(temperature) + "}";

        Serial.println("🚀 Sending to backend:");
        Serial.println("   URL: " + String(serverUrl));
        Serial.println("   Payload: " + jsonPayload);

        // Send POST request
        int httpCode = http.POST(jsonPayload);

        if (httpCode > 0)
        {
            Serial.println("✅ Backend response: " + String(httpCode));
            if (httpCode == 200)
            {
                String response = http.getString();
                Serial.println("   Response: " + response);
            }
        }
        else
        {
            Serial.println("❌ Error sending to backend: " + http.errorToString(httpCode));
        }

        http.end();
    }
    else
    {
        Serial.println("⚠️ WiFi not connected. Reconnecting...");
        WiFi.reconnect();
    }
}
