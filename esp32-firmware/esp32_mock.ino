#include <WiFi.h>
#include <HTTPClient.h>

String buildPayload(float vwc, float temp)
{
  String json = "";
  for (int i = 0; i < 10; i++)
  {
    json += "{\"nodeId\":1,\"vwc\":" + String(vwc) + ",";
    json += "\"temp\":" + String(temp) + "}";
    json = json.substring(0, json.length());
  }
  return json;
}

void connectWiFi()
{
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(10);
  }
}

HTTPClient http;
void sendData(String payload)
{
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.POST(payload);
}

void setup()
{
  connectWiFi();
}

void loop()
{
  float vwc = 28.5;
  float temp = 22.5;

  String payload = buildPayload(vwc, temp);
  sendData(payload);

  delay(1000);
}
