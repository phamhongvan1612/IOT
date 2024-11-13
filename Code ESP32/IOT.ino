#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <BH1750FVI.h>
#include <ArduinoJson.h>

#define LED1 2
#define LED2 4
#define LED_WARNING 15  // Định nghĩa chân cho LED cảnh báo
#define DHTPIN 5
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
BH1750FVI LightSensor(BH1750FVI::k_DevModeContLowRes);

const char* ssid = "Long";
const char* password = "16181985";

const char* mqtt_server = "192.168.55.104";
const char* mqtt_user = "user";
const char* mqtt_password = "0123456789";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED_WARNING, OUTPUT); // Cấu hình chân LED cảnh báo
  
  dht.begin();
  LightSensor.begin();
  
  setup_wifi();

  client.setServer(mqtt_server, 2003);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read temperature and humidity
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Read light intensity
  uint16_t lux = LightSensor.GetLightIntensity();

  // Generate random dust value
  int dust = random(0, 101);

  if (!isnan(h) && !isnan(t)) {
    // Create JSON for sensor data
    StaticJsonDocument<200> jsonData;
    jsonData["Temperature"] = t;
    jsonData["Humidity"] = h;
    jsonData["Light"] = lux;
    jsonData["Dust"] = dust;

    // Serialize JSON data to string
    String jsonString;
    serializeJson(jsonData, jsonString);

    // Print and publish JSON data to MQTT
    Serial.print("Sensor Data: ");
    Serial.println(jsonString);
    client.publish("Data", jsonString.c_str());
  } else {
    Serial.println("Cannot read data from DHT11!");
  }

  delay(2000);
}

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_password)) {
      Serial.println("Connected!");
      client.subscribe("ControlLED");      // Topic to control LEDs
      client.subscribe("WarningLED");      // Topic to control warning LED
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" trying again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Received message: ");
  Serial.println(message);

  StaticJsonDocument<200> doc;
  JsonObject obj = doc.to<JsonObject>();

  // Process message and update LED status
  if (message == "led1_1") {
    digitalWrite(LED1, HIGH);
    obj["Device"] = "Led1";
    obj["Action"] = "ON";
  } else if (message == "led1_0") {
    digitalWrite(LED1, LOW);
    obj["Device"] = "Led1";
    obj["Action"] = "OFF";
  } else if (message == "led2_1") {
    digitalWrite(LED2, HIGH);
    obj["Device"] = "Led2";
    obj["Action"] = "ON";
  } else if (message == "led2_0") {
    digitalWrite(LED2, LOW);
    obj["Device"] = "Led2";
    obj["Action"] = "OFF";
  } else if (message == "led_warning_1") {  // Control warning LED
    digitalWrite(LED_WARNING, HIGH);
    obj["Device"] = "LedWarning";
    obj["Action"] = "ON";
    
    // Serialize the JSON object and publish to WarningStatus
    String warningJsonString;
    serializeJson(doc, warningJsonString);
    client.publish("WarningStatus", warningJsonString.c_str());
  } else if (message == "led_warning_0") {
    digitalWrite(LED_WARNING, LOW);
    obj["Device"] = "LedWarning";
    obj["Action"] = "OFF";
    
    // Serialize the JSON object and publish to WarningStatus
    String warningJsonString;
    serializeJson(doc, warningJsonString);
    client.publish("WarningStatus", warningJsonString.c_str());
  } else {
    Serial.println("Unknown command");
    return;
  }

  // Serialize the JSON object for StatusDevice
  String jsonString;
  serializeJson(doc, jsonString);
  Serial.println("JSON Payload: " + jsonString);
  client.publish("StatusDevice", jsonString.c_str());
}
