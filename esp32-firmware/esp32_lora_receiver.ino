#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>

// LoRa pins same as node
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// Aggregation window (ms)
const unsigned long WINDOW_MS = 30000; // 30s

#pragma pack(push, 1)
struct WusnPacket
{
    uint8_t version;
    uint8_t nodeId;
    uint8_t seq;
    uint16_t moisturePctX10;
    int16_t tempCX10;
    uint8_t batteryPct;
    uint16_t vbat_mV;
    uint16_t crc;
};
#pragma pack(pop)

struct NodeSample
{
    bool valid;
    uint8_t nodeId;
    float moisturePct;
    float tempC;
    uint8_t batteryPct;
    int16_t rssi; // from LoRa
    uint8_t seq;
    unsigned long firstSeen;
    unsigned long lastSeen;
    uint8_t packetCount;
};

const int MAX_NODES = 8;
NodeSample samples[MAX_NODES];

unsigned long windowStart = 0;

// --- CRC same as node ---
uint16_t simpleCrc16(uint8_t *data, size_t len);

// -------------------------------------------------------------------

void setup()
{
    Serial.begin(115200);
    delay(500);

    Serial.println("\n====== WUSN GATEWAY BOOT ======");
    SPI.begin(18, 19, 23, LORA_SS);
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

    if (!LoRa.begin(433E6))
    {
        Serial.println("LoRa init failed. Check wiring.");
        while (1)
            delay(1000);
    }

    LoRa.setSyncWord(0xF3);
    LoRa.setSpreadingFactor(10);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);

    clearWindow();
    windowStart = millis();
    Serial.println("Gateway ready, listening...");
}

void loop()
{
    int packetSize = LoRa.parsePacket();
    if (packetSize)
    {
        handleLoRaPacket(packetSize);
    }

    unsigned long now = millis();
    if (now - windowStart >= WINDOW_MS)
    {
        finalizeWindow();
        clearWindow();
        windowStart = now;
    }
}

// -------------------------------------------------------------------

void clearWindow()
{
    for (int i = 0; i < MAX_NODES; i++)
    {
        samples[i].valid = false;
    }
}

int indexForNode(uint8_t nodeId)
{
    for (int i = 0; i < MAX_NODES; i++)
    {
        if (samples[i].valid && samples[i].nodeId == nodeId)
            return i;
    }
    for (int i = 0; i < MAX_NODES; i++)
    {
        if (!samples[i].valid)
            return i;
    }
    return -1;
}

void handleLoRaPacket(int packetSize)
{
    if (packetSize != sizeof(WusnPacket))
    {
        Serial.print("Unexpected packet size: ");
        Serial.println(packetSize);
        // Optionally read & discard
        while (LoRa.available())
            LoRa.read();
        return;
    }

    WusnPacket p;
    uint8_t *buf = (uint8_t *)&p;
    for (int i = 0; i < sizeof(WusnPacket); i++)
    {
        if (LoRa.available())
        {
            buf[i] = LoRa.read();
        }
        else
        {
            Serial.println("Packet truncated");
            return;
        }
    }

    int rssi = LoRa.packetRssi();

    uint16_t calcCrc = simpleCrc16((uint8_t *)&p, sizeof(WusnPacket) - 2);
    if (calcCrc != p.crc)
    {
        Serial.println("CRC mismatch, dropping packet");
        return;
    }

    float moisture = p.moisturePctX10 / 10.0;
    float tempC = p.tempCX10 / 10.0;

    int idx = indexForNode(p.nodeId);
    if (idx < 0)
    {
        Serial.println("No space for new node, dropping");
        return;
    }

    unsigned long now = millis();
    NodeSample &s = samples[idx];
    if (!s.valid)
    {
        s.valid = true;
        s.nodeId = p.nodeId;
        s.firstSeen = now;
        s.packetCount = 0;
    }

    // Latest wins; average RSSI over multiple packets
    s.moisturePct = moisture;
    s.tempC = tempC;
    s.batteryPct = p.batteryPct;
    s.seq = p.seq;
    s.lastSeen = now;
    if (s.packetCount == 0)
    {
        s.rssi = rssi;
    }
    else
    {
        s.rssi = (int16_t)((s.rssi * s.packetCount + rssi) / (s.packetCount + 1));
    }
    s.packetCount++;

    Serial.print("RX node ");
    Serial.print(p.nodeId);
    Serial.print(" M=");
    Serial.print(moisture);
    Serial.print("% T=");
    Serial.print(tempC);
    Serial.print("C B=");
    Serial.print((int)p.batteryPct);
    Serial.print("% RSSI=");
    Serial.println(rssi);
}

void finalizeWindow()
{
    // Build JSON for /api/sensor/aggregated
    StaticJsonDocument<1024> doc;
    doc["timestamp"] = millis(); // placeholder; ideally real ISO timestamp

    JsonArray nodesArr = doc.createNestedArray("nodes");

    for (int i = 0; i < MAX_NODES; i++)
    {
        if (!samples[i].valid)
            continue;
        NodeSample &s = samples[i];

        JsonObject n = nodesArr.createNestedObject();
        n["nodeId"] = s.nodeId;
        n["moisture"] = s.moisturePct;
        n["temperature"] = s.tempC;
        n["batteryLevel"] = s.batteryPct;
        n["rssi"] = s.rssi;
        n["seq"] = s.seq;
        n["gatewaySeenAt"] = s.lastSeen; // ms since boot (placeholder)
        n["packetCount"] = s.packetCount;
    }

    JsonObject meta = doc.createNestedObject("gatewayMeta");
    meta["gatewayId"] = "gw-01";
    meta["windowMs"] = WINDOW_MS;
    meta["windowStart"] = windowStart;

    // Print JSON to Serial (for now)
    Serial.println("\n--- WINDOW JSON ---");
    serializeJsonPretty(doc, Serial);
    Serial.println("\n-------------------");
}

// CRC
uint16_t simpleCrc16(uint8_t *data, size_t len)
{
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++)
    {
        crc ^= data[i];
        for (int b = 0; b < 8; b++)
        {
            if (crc & 1)
                crc = (crc >> 1) ^ 0xA001;
            else
                crc >>= 1;
        }
    }
    return crc;
}
