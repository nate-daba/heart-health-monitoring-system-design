/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#line 1 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/heartRateAndSpO2/src/heartRateAndSpO2.ino"
#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "heartRate.h"
#include "Particle.h"
#include "utils.h"
#include <fcntl.h>

void setup();
void loop();
#line 9 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/heartRateAndSpO2/src/heartRateAndSpO2.ino"
SYSTEM_THREAD(ENABLED);

MAX30105 particleSensor;

#define MAX_BRIGHTNESS 255
#define ONE_DAY_MILLIS 5000 // (24 * 60 * 60 * 1000)

uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t bufferLength;
int32_t spo2;
int8_t validSPO2;
int32_t heartRate;
int8_t validHeartRate;

byte takeMeasurementLED = D7;
byte yellowLED = D6;
byte greenLED = D4;

const int EEPROM_SIZE = 512; // Define the size of EEPROM for data storage
// char dataInEEPROM[EEPROM_SIZE]; // Buffer to store data in EEPROM
char dataInEEPROM[EEPROM_SIZE]; // Declare a character array to store the data

unsigned long measurementPeriod = 60000;
bool takeMeasurement = false;
unsigned long lastMeasurementPrompted = 0;
unsigned long timeout = 5 * 60 * 1000;
unsigned long lastBlinkMillis = 0;
const long blinkInterval = 500;
unsigned long lastSync = millis();


unsigned long lastUnixTime = 0; // Initialize with a known Unix time
unsigned long lastMillis = 0;

void setup()
{
  Particle.function("flashGreenLED", flashGreenLED);

  Serial.begin(115200);
  Serial.println("Initializing...");

  pinMode(takeMeasurementLED, OUTPUT);
  pinMode(yellowLED, OUTPUT);
  pinMode(greenLED, OUTPUT);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST))
  {
    Serial.println("MAX30105 was not found. Please check wiring/power.");
    while (1);
  }

  byte ledBrightness = 60;
  byte sampleAverage = 4;
  byte ledMode = 2; // 2 = Red only, 3 = Red + IR, 7 = Red + IR + Green
  byte sampleRate = 100;
  int pulseWidth = 411;
  int adcRange = 4096;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  Time.zone(-7);  // setup a time zone, which is part of the ISO8601 format

}

void loop()
{
  static bool connectedToCloud = false; // Variable to track Wi-Fi connection status
  static bool waitingForFinger = false;
  static unsigned long startWaitingTime = 0;

  // Check if Wi-Fi is connected
  if (Particle.connected() && !connectedToCloud)
  {
    Serial.println("Wi-Fi connected.");
    if (storageFileHasContents("/data.txt")) {
      Serial.println("Publishing stored data from file...");
      // Publish any stored data from the file
      publishStoredDataFromFile();
    }
    else {
      Serial.println("No stored data in file.");
    }
    connectedToCloud = true; // Update Wi-Fi connection status
  }
  if (!takeMeasurement && ((lastMeasurementPrompted == 0) || (millis() - lastMeasurementPrompted > measurementPeriod))) {
    takeMeasurement = true;
    waitingForFinger = true;
    startWaitingTime = millis();
    Serial.println("Please place your index finger on the sensor.");
    lastMeasurementPrompted = millis();
  }

  if (waitingForFinger) {
    if (millis() - startWaitingTime >= timeout) {
      Serial.println("Timeout: 5 minutes elapsed without a measurement.");
      takeMeasurement = false;
      waitingForFinger = false;
    } else {
      long irValue = particleSensor.getIR();
      if (irValue >= 50000) {
        waitingForFinger = false;
        Serial.println("Taking measurement now ...");
        digitalWrite(takeMeasurementLED, LOW);
        // proceed with measurement code
      } else {
        if (millis() - lastBlinkMillis > blinkInterval) {
          digitalWrite(takeMeasurementLED, !digitalRead(takeMeasurementLED));
          lastBlinkMillis = millis();
        }
      }
    }
  }

  if (takeMeasurement && !waitingForFinger) 
  {
    bufferLength = 100;

    for (byte i = 0; i < bufferLength; i++) 
    {
      while (particleSensor.available() == false)
        particleSensor.check();

      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample();
    }

    maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

    if (validSPO2 && validHeartRate) 
    {
      Serial.print(F("HR="));
      Serial.print(heartRate, DEC);

      Serial.print(F(", HRvalid="));
      Serial.print(validHeartRate, DEC);

      Serial.print(F(", SPO2="));
      Serial.print(spo2, DEC);

      Serial.print(F(", SPO2Valid="));
      Serial.print(validSPO2, DEC);
      
      // prepare data to publish
      String currentTime = Time.format(TIME_FORMAT_ISO8601_FULL);
      String data = String::format("{\"heartrate\":%d,\"spo2\":%d", heartRate, spo2);
      // Check if Wi-Fi is connected
      if (Particle.connected()) 
      {
        // If connected to Wi-Fi, publish the data immediately
        data = String::format("%s,\"measurementTime\":\"%s\"}", data.c_str(), Time.format(TIME_FORMAT_ISO8601_FULL).c_str());
        publishData(data);
      } else 
      {
        // Not connected to Wi-Fi, store the data locally
        data = String::format("%s%s", data.c_str(), "}");
        storeDataLocallyToFile(data, millis(), yellowLED);
        connectedToCloud = false; // Update Wi-Fi connection status
      }
      takeMeasurement = false;
    } else 
    {
      Serial.println(F("Invalid reading. Please ensure your finger is properly placed on the sensor and remain still."));
      lastMeasurementPrompted = millis();
    }
  }
}

