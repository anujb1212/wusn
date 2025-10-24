#include <SPI.h>
#include <LoRa.h>

// LoRa pins
#define SS 5
#define RST 14
#define DIO0 2
#define BAND 868E6 // 868 MHz for India (check local regulations)

// Node configuration - CHANGE THIS FOR EACH NODE
#define NODE_ID 1         // Change to 1, 2, 3, 4 for each sensor
#define CROP_TYPE "wheat" // Change per node: "wheat", "rice", "vegetables", etc.

// Sensor pins (adjust based on your sensors)
#define MOISTURE_PIN 34 // Analog pin for soil moisture sensor
#define TEMP_PIN 4      // Digital pin for DS18B20 or analog for other temp sensors

// Reading interval
#define READING_INTERVAL 10000 // 10 seconds (change to 600000 for 10 minutes in production)

void setup()
{
    Serial.begin(115200);
    while (!Serial)
        ;

    Serial.println("Initializing Sensor Node " + String(NODE_ID));

    // Initialize LoRa
    LoRa.setPins(SS, RST, DIO0);
    while (!LoRa.begin(BAND))
    {
        Serial.println("LoRa initialization failed. Retrying...");
        delay(500);
    }

    // LoRa configuration for better range
    LoRa.setSyncWord(0xF3);
    LoRa.setSpreadingFactor(10);    // 7-12, higher = longer range, slower speed
    LoRa.setSignalBandwidth(125E3); // 125 kHz
    LoRa.setCodingRate4(5);         // 5-8
    LoRa.setTxPower(20);            // Max power for long range

    Serial.println("✅ LoRa Sender Node " + String(NODE_ID) + " Initialized");
    Serial.println("Crop Type: " + String(CROP_TYPE));
}

void loop()
{
    // Read sensors
    int moistureRaw = analogRead(MOISTURE_PIN);
    int moisture = map(moistureRaw, 0, 4095, 0, 1000); // ESP32 has 12-bit ADC (0-4095)

    // For temperature, use your sensor's library
    // Example with analog sensor:
    int tempRaw = analogRead(TEMP_PIN);
    int temperature = map(tempRaw, 0, 4095, 0, 50); // Adjust based on your sensor

    // Or use DS18B20 digital sensor (requires OneWire library)
    // temperature = sensors.getTempCByIndex(0);

    // Create data packet: "NodeID,CropType,Moisture,Temperature"
    String packet = String(NODE_ID) + "," +
                    String(CROP_TYPE) + "," +
                    String(moisture) + "," +
                    String(temperature);

    // Send via LoRa
    LoRa.beginPacket();
    LoRa.print(packet);
    LoRa.endPacket();

    // Debug output
    Serial.println("📡 Sent: " + packet);
    Serial.println("   Node: " + String(NODE_ID));
    Serial.println("   Crop: " + String(CROP_TYPE));
    Serial.println("   Moisture: " + String(moisture));
    Serial.println("   Temperature: " + String(temperature) + "°C");
    Serial.println("   RSSI: " + String(LoRa.packetRssi()) + " dBm");
    Serial.println();

    // Wait before next reading
    delay(READING_INTERVAL);
}
