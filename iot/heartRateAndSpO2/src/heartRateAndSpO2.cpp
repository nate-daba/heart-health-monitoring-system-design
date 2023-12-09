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
int updateMeasurementPeriod(String period);
int updateMeasurementTimeofDay(String jsonString);
#line 9 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/heartRateAndSpO2/src/heartRateAndSpO2.ino"
SYSTEM_THREAD(ENABLED);

MAX30105 particleSensor;

#define MAX_BRIGHTNESS 255
#define ONE_DAY_MILLIS 24 * 60 * 60 * 1000 // (24 * 60 * 60 * 1000)

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
struct MeasurementTime {
  unsigned long startTime = 360; // minutes since midnight
  unsigned long endTime = 1320;   // minutes since midnight
} measurementTimeOfDay;

bool takeMeasurement = false;
bool validRange = false;
unsigned long lastMeasurementPrompted = 0;
unsigned long dataAge = 0;
unsigned long timeOfLastStoredMeasurement = 0; // Variable to keep track of the last data save time
unsigned long timeout = 5 * 60 * 1000;
unsigned long lastBlinkMillis = 0;
const long blinkInterval = 500;
unsigned long lastSync = millis();
static bool connectedToCloud = false; // Variable to track Wi-Fi connection status
static bool waitingForFinger = false;
static unsigned long startWaitingTime = 0;



unsigned long lastUnixTime = 0; // Initialize with a known Unix time
unsigned long lastMillis = 0;

void setup()
{
  Particle.function("flashGreenLED", flashGreenLED);
  Particle.function("updateMeasurementPeriod", updateMeasurementPeriod);
  Particle.function("updateMeasurementTimeofDay", updateMeasurementTimeofDay);

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

  // Clear stale data from file
  void cleanUpDataFile();

  // setup a time zone, which is part of the ISO8601 format
  Time.zone(-7);  

}

void loop()
{
  unsigned long currentTimeInMinutes = getCurrentTime();
  
  // Check if current time is within the measurement window
  if (currentTimeInMinutes >= measurementTimeOfDay.startTime && currentTimeInMinutes < measurementTimeOfDay.endTime) 
  {
    // Check if stored data is older than 24 hours
    dataAge = millis() - timeOfLastStoredMeasurement;
    if (dataAge >= ONE_DAY_MILLIS) 
    {
      // Clear stale data from file
      Serial.println("Stored data is older than 24 hours. Clearing stale data from file...");
      cleanUpDataFile();
      timeOfLastStoredMeasurement = millis();
    }
    // Check if device is connected to Particle cloud 
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
    if (!takeMeasurement && ((lastMeasurementPrompted == 0) || (millis() - lastMeasurementPrompted > measurementPeriod))) 
    {
      takeMeasurement = true;
      waitingForFinger = true;
      startWaitingTime = millis();
      Serial.println("Please place your index finger on the sensor.");
      lastMeasurementPrompted = millis();
    }

    if (waitingForFinger) 
    {
      if (millis() - startWaitingTime >= timeout) 
      {
        Serial.println("Timeout: 5 minutes elapsed without a measurement.");
        takeMeasurement = false;
        waitingForFinger = false;
        digitalWrite(takeMeasurementLED, LOW); // Ensure the LED is turned off after timeout
        lastMeasurementPrompted = millis(); // Reset the lastMeasurementPrompted to current time to wait for next measurement period
      } else 
      {
        long irValue = particleSensor.getIR();
        if (irValue >= 50000) 
        {
          waitingForFinger = false;
          Serial.println("Taking measurement now ...");
          digitalWrite(takeMeasurementLED, LOW);
          // proceed with measurement code
        } else {
          if (millis() - lastBlinkMillis > blinkInterval) 
          {
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

      validRange = (spo2 > 50) && (spo2 < 101) && (heartRate > 30 ) && (heartRate < 300);
      if (validSPO2 && validHeartRate && validRange) 
      {
        printSensorData(heartRate, validHeartRate, spo2, validSPO2);
        // prepare data to publish
        String currentTime = Time.format(TIME_FORMAT_ISO8601_FULL);
        String data = String::format("{\"heartrate\":%d,\"spo2\":%d", heartRate, spo2);
        // Check if Wi-Fi is connected
        if (Particle.connected()) 
        {
          // If connected to Wi-Fi, publish the prepared data immediately
          data = String::format("%s,\"measurementTime\":\"%s\"}", data.c_str(), Time.format(TIME_FORMAT_ISO8601_FULL).c_str());
          publishData(data);
        } else 
        {
          // Not connected to Wi-Fi, store the prepared data locally
          data = String::format("%s%s", data.c_str(), "}");
          storeDataLocallyToFile(data, millis(), yellowLED);
          connectedToCloud = false; // Update Wi-Fi connection status
          // Update the last data save time
          timeOfLastStoredMeasurement = millis();
        }
        takeMeasurement = false;
      } else 
      {
        Serial.println(F("Invalid reading. Please ensure your finger is properly placed on the sensor and remain still."));
      }
      lastMeasurementPrompted = millis(); // Reset the lastMeasurementPrompted to current time to wait for next measurement period
    }
  }
}

int updateMeasurementPeriod(String period) {
  unsigned long measurementPeriodInt = period.toInt(); // Convert String to unsigned long
  measurementPeriod = measurementPeriodInt * 60 * 1000; // Update the global variable
  Serial.println("Updating measurement period...");
  Serial.printf("New measurement period: %lu ms\n", measurementPeriod); // Use the global variable

  return 1; // Indicate success
}

// Function to update the measurement time of day
int updateMeasurementTimeofDay(String jsonString) {
    JSONValue outerObj = JSONValue::parseCopy(jsonString);
    JSONObjectIterator iter(outerObj);
    Serial.println("received JSON string: " + jsonString);
    String startTimeStr;
    String endTimeStr;

    while (iter.next()) {
        if (iter.name() == "startTime") {
            startTimeStr = (const char *)iter.value().toString();
        } else if (iter.name() == "endTime") {
            endTimeStr = (const char *)iter.value().toString();
        }
    }

    if (startTimeStr != "" && endTimeStr != "") {
        measurementTimeOfDay.startTime = parseTimeToMinutes(startTimeStr);
        measurementTimeOfDay.endTime = parseTimeToMinutes(endTimeStr);

        Serial.println("Measurement Time of Day updated:");
        Serial.printf("Start Time: %lu minutes, End Time: %lu minutes\n", 
                    measurementTimeOfDay.startTime, measurementTimeOfDay.endTime);

        return 1; // Indicate success
    } else {
        Serial.println("Invalid JSON format");
        return -1; // Indicate failure
    }
}



