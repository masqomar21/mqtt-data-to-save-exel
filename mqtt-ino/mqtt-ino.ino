#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char *ssid = "masqomar21";
const char *password = "budakcindo";

// MQTT broker settings
const char *mqtt_server = "broker.hivemq.com";
const char *mqtt_data_topic = "esp32/data";
const char *mqtt_control_topic = "esp32/control";

WiFiClient espClient;
PubSubClient client(espClient);

// Status flags
bool isRunning = false;

void setup_wifi()
{
    delay(10);
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Attempting MQTT connection...");
        String clientId = "ESP32Client-";
        clientId += String(random(0xffff), HEX);
        if (client.connect(clientId.c_str()))
        {
            Serial.println("connected");
            client.subscribe(mqtt_control_topic);
        }
        else
        {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void callback(char *topic, byte *payload, unsigned int length)
{
    String incomingMessage;
    for (int i = 0; i < length; i++)
    {
        incomingMessage += (char)payload[i];
    }

    // Handle control messages from React
    if (String(topic) == mqtt_control_topic)
    {
        if (incomingMessage == "START")
        {
            isRunning = true;
            Serial.println("Start command received");
        }
        else if (incomingMessage == "STOP")
        {
            isRunning = false;
            Serial.println("Stop command received");
        }
    }
}

void setup()
{
    Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);

    // Other setup code
}

void loop()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();

    if (isRunning)
    {
        // Your code to gather sensor data and send it to MQTT
        int fsr1value = analogRead(35);
        int fsr2value = analogRead(32);
        float pitch = 0.0;   // Assuming you calculate pitch elsewhere
        int servoAngle = 90; // Assuming you calculate servo angle elsewhere

        char msg[50];
        snprintf(msg, 50, "%d,%d,%.2f,%d", fsr1value, fsr2value, pitch, servoAngle);
        client.publish(mqtt_data_topic, msg);

        delay(1000); // Adjust delay as needed
    }
}
