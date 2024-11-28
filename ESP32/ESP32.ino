#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <BH1750FVI.h>
#include <ArduinoJson.h>

#define LED1 2
#define LED2 4
#define LED3 15  // Thêm LED3
#define LED4 18  // Thêm LED4
#define DHTPIN 5
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
BH1750FVI LightSensor(BH1750FVI::k_DevModeContLowRes);

const char* ssid = "#ναωи";
const char* password = "16122003@";

const char* mqtt_server = "172.20.10.5";
const char* mqtt_user = "user";
const char* mqtt_password = "0123456789";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);  // Cấu hình LED3
  pinMode(LED4, OUTPUT);  // Cấu hình LED4
  
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

  if (!isnan(h) && !isnan(t)) {
    // Create JSON for sensor data
    StaticJsonDocument<200> jsonData;
    jsonData["Temperature"] = t;
    jsonData["Humidity"] = h;
    jsonData["Light"] = lux;

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
      client.subscribe("ControlLED");  // Topic to control LEDs
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
    publishStatus("StatusDevice", obj); // Publish for LED1
  } else if (message == "led1_0") {
    digitalWrite(LED1, LOW);
    obj["Device"] = "Led1";
    obj["Action"] = "OFF";
    publishStatus("StatusDevice", obj); // Publish for LED1
  } else if (message == "led2_1") {
    digitalWrite(LED2, HIGH);
    obj["Device"] = "Led2";
    obj["Action"] = "ON";
    publishStatus("StatusDevice", obj); // Publish for LED2
  } else if (message == "led2_0") {
    digitalWrite(LED2, LOW);
    obj["Device"] = "Led2";
    obj["Action"] = "OFF";
    publishStatus("StatusDevice", obj); // Publish for LED2
  } else if (message == "led3_1") {
    digitalWrite(LED3, HIGH);
    obj["Device"] = "Led3";
    obj["Action"] = "ON";
    publishStatus("StatusLED", obj); // Publish for LED3
  } else if (message == "led3_0") {
    digitalWrite(LED3, LOW);
    obj["Device"] = "Led3";
    obj["Action"] = "OFF";
    publishStatus("StatusLED", obj); // Publish for LED3
  } else if (message == "led4_1") {
    digitalWrite(LED4, HIGH);
    obj["Device"] = "Led4";
    obj["Action"] = "ON";
    publishStatus("StatusLED", obj); // Publish for LED4
  } else if (message == "led4_0") {
    digitalWrite(LED4, LOW);
    obj["Device"] = "Led4";
    obj["Action"] = "OFF";
    publishStatus("StatusLED", obj); // Publish for LED4
  } else {
    Serial.println("Unknown command");
    return;
  }
}

// Helper function to publish JSON payload
void publishStatus(const char* topic, JsonObject& obj) {
  String jsonString;
  serializeJson(obj, jsonString);
  Serial.println("Publishing to topic: " + String(topic));
  Serial.println("JSON Payload: " + jsonString);
  client.publish(topic, jsonString.c_str());
}
