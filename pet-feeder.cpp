#include <ESP8266WiFi.h>
#include "Adafruit_MQTT.h"
#include "Adafruit_MQTT_Client.h"
#include <Servo.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>


WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000);


Servo servo;
LiquidCrystal_I2C lcd(0x27, 16, 2);


#define WIFI_SSID "xxxxxx"
#define WIFI_PASS "xxxxxxxx"


#define MQTT_SERV "io.adafruit.com"
#define MQTT_PORT 1883
#define MQTT_NAME "adafruitiousername"
#define MQTT_PASS "adafruitiopass"


int SERVO_PIN = D4;
int CLOSE_ANGLE = 0;
int OPEN_ANGLE = 45;
int hh, mm, ss;
int feed_hour = 0;
int feed_minute = 0;


// MQTT Setup
WiFiClient client;
Adafruit_MQTT_Client mqtt(&client, MQTT_SERV, MQTT_PORT, MQTT_NAME, MQTT_PASS);
Adafruit_MQTT_Subscribe onoff = Adafruit_MQTT_Subscribe(&mqtt, MQTT_NAME "/feeds/onoff");
boolean feed = true;


void setup() {
    Serial.begin(9600);
    timeClient.begin();
    Wire.begin(D2, D1);
   
    lcd.begin(16,2);
    lcd.backlight();


    // Connect to WiFi
    Serial.print("\n\nConnecting to WiFi... ");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("Connected to WiFi!");


    // Subscribe to MQTT feed
    mqtt.subscribe(&onoff);
    servo.attach(SERVO_PIN);
    servo.write(CLOSE_ANGLE);
}


void loop() {
    MQTT_connect();
    timeClient.update();


    hh = timeClient.getHours();
    mm = timeClient.getMinutes();
    ss = timeClient.getSeconds();


    lcd.setCursor(0, 0);
    lcd.print("Time: ");
    if (hh > 12) {
        lcd.print(hh - 12);
        lcd.print(":");
        lcd.print(mm);
        lcd.print(":");
        lcd.print(ss);
        lcd.print(" PM  ");
    } else {
        lcd.print(hh);
        lcd.print(":");
        lcd.print(mm);
        lcd.print(":");
        lcd.print(ss);
        lcd.print(" AM  ");
    }


    lcd.setCursor(0, 1);
    lcd.print("Feed Time: ");
    lcd.print(feed_hour);
    lcd.print(':');
    lcd.print(feed_minute);


    Adafruit_MQTT_Subscribe *subscription;
    while ((subscription = mqtt.readSubscription(5000))) {
        if (subscription == &onoff) {
            Serial.println((char *)onoff.lastread);


            if (!strcmp((char *)onoff.lastread, "ON")) {
                open_door();
                delay(3000);
                close_door();
            }
        }
    }


    mqtt.processPackets(5000); // Ensure MQTT is handled correctly


    if (hh == feed_hour && mm == feed_minute && feed) {
        open_door();
        delay(1000);
        close_door();
        feed = false;
    }
}


void MQTT_connect() {
    int8_t ret;
    if (mqtt.connected()) return;


    uint8_t retries = 3;
    while ((ret = mqtt.connect()) != 0) {
        mqtt.disconnect();
        delay(5000);
        retries--;
        if (retries == 0) {
            Serial.println("Failed to connect to MQTT. Retrying...");
            return;
        }
    }
    Serial.println("MQTT Connected!");
}


void open_door() {
    servo.write(OPEN_ANGLE);
}


void close_door() {
    servo.write(CLOSE_ANGLE);
}

