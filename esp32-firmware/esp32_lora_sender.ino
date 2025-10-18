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
    Serial.println("LoRa Sender Initialized");
}

void loop()
{
    int moisture = random(300, 800);
    int temperature = random(20, 35);

    String data = String(moisture) + "," + String(temperature);

    LoRa.beginPacket();
    LoRa.print(data);
    LoRa.endPacket();

    Serial.println("Sent: " + data);
    delay(10000);
}
