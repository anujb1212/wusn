#include <SPI.h>
#include <LoRa.h>

#define SS 5
#define RST 14
#define DIO0 2
#define BAND 868E6

void setup()
{
    Serial.begin(115200);
    while (!Serial)
        ;

    LoRa.setPins(SS, RST, DIO0);
    while (!LoRa.begin(BAND))
    {
        Serial.println(".");
        delay(500);
    }
    LoRa.setSyncWord(0xF3);
    Serial.println("LoRa Receiver Initialized");
}

void loop()
{
    int packetSize = LoRa.parsePacket();
    if (packetSize)
    {
        String data = LoRa.readString();
        Serial.println("Received: " + data);
        // Add code here to forward data to backend if needed
    }
}
