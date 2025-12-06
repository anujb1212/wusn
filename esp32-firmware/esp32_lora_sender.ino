#include <SPI.h>
#include <LoRa.h>

// --- 1. PIN DEFINITIONS ---
#define PIN_SOIL 34 // Soil Moisture
#define PIN_NTC 35  // NTC temp sensor
#define PIN_BAT 32  // Battery level

#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// --- 2. CONFIGURATION ---
const uint8_t NODE_ID = 1; // Change per node: 1..4
const float BETA = 3950.0; // NTC beta

// Sleep config
#define uS_TO_S_FACTOR 1000000ULL
// Real: 10 * 60 * uS_TO_S_FACTOR (10 min)
#define SLEEP_INTERVAL_SEC 600 // change to 10 in simulation
#define SLEEP_INTERVAL_US (SLEEP_INTERVAL_SEC * uS_TO_S_FACTOR)

// Simple packet struct (must match gateway parsing)
#pragma pack(push, 1)
struct WusnPacket
{
    uint8_t version;         // 1
    uint8_t nodeId;          // 1..n
    uint8_t seq;             // rolling counter
    uint16_t moisturePctX10; // moisture % * 10
    int16_t tempCX10;        // temperature * 10
    uint8_t batteryPct;      // 0..100
    uint16_t vbat_mV;        // optional: raw battery mV
    uint16_t crc;            // simple XOR based (demo)
};
#pragma pack(pop)

uint8_t seqCounter = 0;

// --- Forward declarations ---
float readMoisturePct();
float readTemperatureC();
uint8_t readBatteryPct(uint16_t *vbat_mV);
uint16_t simpleCrc16(uint8_t *data, size_t len);
void sendPacketWithRetries(const WusnPacket &p, int retries);

// -------------------------------------------------------------------

void setup()
{
    Serial.begin(115200);
    delay(500);

    Serial.println("\n====== WUSN NODE BOOT ======");

    // --- Battery check first ---
    uint16_t vbat_mV_raw;
    uint8_t batPct = readBatteryPct(&vbat_mV_raw);
    Serial.print("Battery: ");
    Serial.print(batPct);
    Serial.println("%");

    if (batPct < 5)
    {
        Serial.println("CRITICAL: Battery <5%. Permanent deep sleep.");
        esp_deep_sleep_start(); // wake only by reset
    }

    // --- LoRa init ---
    SPI.begin(18, 19, 23, LORA_SS);
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

    if (!LoRa.begin(433E6))
    {
        Serial.println("LoRa init failed. Sleeping anyway.");
        goToDeepSleep();
    }

    LoRa.setSyncWord(0xF3);
    LoRa.setSpreadingFactor(10);    // SF10 for better underground robustness
    LoRa.setSignalBandwidth(125E3); // 125 kHz
    LoRa.setCodingRate4(5);         // 4/5

    // --- Low‑battery special mode ---
    if (batPct < 20)
    {
        Serial.println("Low battery (<20%). SOS packet + long sleep.");

        WusnPacket p;
        p.version = 1;
        p.nodeId = NODE_ID;
        p.seq = seqCounter++;
        p.moisturePctX10 = 0;
        p.tempCX10 = 0;
        p.batteryPct = batPct;
        p.vbat_mV = vbat_mV_raw;

        // Minimal CRC
        p.crc = simpleCrc16((uint8_t *)&p, sizeof(WusnPacket) - 2);

        sendPacketWithRetries(p, 3);

        // 24h sleep in real deployment, 10s for sim:
        uint64_t sleepUs = (uint64_t)24 * 60 * 60 * uS_TO_S_FACTOR;
        esp_sleep_enable_timer_wakeup(sleepUs);
        esp_deep_sleep_start();
    }

    // --- Normal mode ---
    float moisture = readMoisturePct();
    float tempC = readTemperatureC();

    Serial.print("Moisture: ");
    Serial.print(moisture);
    Serial.println("%");
    Serial.print("Temp: ");
    Serial.print(tempC);
    Serial.println(" C");

    // Re‑read battery for packet
    batPct = readBatteryPct(&vbat_mV_raw);

    WusnPacket p;
    p.version = 1;
    p.nodeId = NODE_ID;
    p.seq = seqCounter++;
    p.moisturePctX10 = (uint16_t)(moisture * 10.0);
    p.tempCX10 = (int16_t)(tempC * 10.0);
    p.batteryPct = batPct;
    p.vbat_mV = vbat_mV_raw;
    p.crc = simpleCrc16((uint8_t *)&p, sizeof(WusnPacket) - 2);

    sendPacketWithRetries(p, 3);

    Serial.println("Cycle complete. Going to sleep.");
    goToDeepSleep();
}

void loop()
{
    // Not used; node is deep‑sleep based
}

// -------------------------------------------------------------------

float readMoisturePct()
{
    const int N = 5;
    uint16_t vals[N];

    for (int i = 0; i < N; i++)
    {
        vals[i] = analogRead(PIN_SOIL);
        delay(150);
    }

    // Simple trimmed mean
    uint32_t sum = 0;
    uint16_t minV = 65535, maxV = 0;
    for (int i = 0; i < N; i++)
    {
        if (vals[i] < minV)
            minV = vals[i];
        if (vals[i] > maxV)
            maxV = vals[i];
        sum += vals[i];
    }
    sum -= (minV + maxV);
    float avg = sum / (float)(N - 2);

    float pct = map(avg, 0.0, 4095.0, 0.0, 100.0);
    if (pct < 0)
        pct = 0;
    if (pct > 100)
        pct = 100;
    return pct;
}

float readTemperatureC()
{
    const int N = 5;
    float accum = 0;
    for (int i = 0; i < N; i++)
    {
        int raw = analogRead(PIN_NTC);
        if (raw <= 0)
            raw = 1;
        float r = 4095.0 / (float)raw - 1.0;
        float tempK = 1.0 / (log(r) / BETA + 1.0 / 298.15);
        float tempC = tempK - 273.15;
        accum += tempC;
        delay(150);
    }
    return accum / N;
}

uint8_t readBatteryPct(uint16_t *vbat_mV)
{
    // NOTE: adjust divider factors to your actual hardware
    uint16_t raw = analogRead(PIN_BAT);
    // Assume 0‑4095 -> 0‑4.2V, scale to mV
    float volts = (raw / 4095.0) * 4.2;
    uint16_t mv = (uint16_t)(volts * 1000);
    if (vbat_mV)
        *vbat_mV = mv;

    // crude mapping 3.2V‑4.2V -> 0‑100%
    float pct = (volts - 3.2) / (4.2 - 3.2) * 100.0;
    if (pct < 0)
        pct = 0;
    if (pct > 100)
        pct = 100;
    return (uint8_t)pct;
}

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

void sendPacketWithRetries(const WusnPacket &p, int retries)
{
    const uint8_t *buf = (const uint8_t *)&p;
    size_t len = sizeof(WusnPacket);

    for (int i = 0; i < retries; i++)
    {
        LoRa.beginPacket();
        LoRa.write(buf, len);
        LoRa.endPacket();

        Serial.print("LoRa packet sent, try ");
        Serial.println(i + 1);

        delay(random(300, 800)); // small random spacing
    }
}

void goToDeepSleep()
{
    uint32_t jitterSec = random(-60, 60); // ±1 min jitter; change for sim
    int64_t sleepUs = ((int64_t)SLEEP_INTERVAL_SEC + jitterSec) * (int64_t)uS_TO_S_FACTOR;
    if (sleepUs < 5 * uS_TO_S_FACTOR)
        sleepUs = 5 * uS_TO_S_FACTOR;

    esp_sleep_enable_timer_wakeup((uint64_t)sleepUs);
    esp_deep_sleep_start();
}
