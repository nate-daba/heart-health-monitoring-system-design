/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#line 1 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/heartRateAndSpO2/src/heartRateAndSpO2.ino"
// Include necessary libraries
#include <Wire.h>
#include "MAX30105.h"         // Library for MAX30105 sensor
#include "spo2_algorithm.h"   // Library for SpO2 (oxygen saturation) algorithm
#include "heartRate.h"        // Library for heart rate calculation
#include "Particle.h"         // Particle IoT Device SDK
#include "utils.h"            // Utility functions
#include <fcntl.h>

// Enable system threading for concurrent execution
void setup();
void loop();
int updateMeasurementPeriod(String period);
int updateMeasurementTimeofDay(String jsonString);
#line 11 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/heartRateAndSpO2/src/heartRateAndSpO2.ino"
SYSTEM_THREAD(ENABLED);

// Create an instance of the MAX30105 sensor
MAX30105 particleSensor;

// Define maximum brightness for the LED
#define MAX_BRIGHTNESS 255
// Define one day in milliseconds
#define ONE_DAY_MILLIS 24 * 60 * 60 * 1000 

// Buffers to store IR and red light data for SpO2 calculation
uint32_t irBuffer[100]; // IR LED sensor data
uint32_t redBuffer[100]; // Red LED sensor data
// Variables for buffer length and calculated values
int32_t bufferLength; // Length of data buffers
int32_t spo2; // Variable to store calculated SpO2 value
int8_t validSPO2; // Flag indicating if SpO2 value is valid
int32_t heartRate; // Variable to store calculated heart rate
int8_t validHeartRate; // Flag indicating if heart rate value is valid

// Define pin numbers for LEDs
byte takeMeasurementLED = D7; // LED to indicate measurement in progress
byte yellowLED = D6; // Yellow LED (used for status indication)
byte greenLED = D4; // Green LED (used for status indication)

// Define measurement period (30 minutes in milliseconds)
unsigned long measurementPeriod = 60000*30;
// Structure to hold measurement time window
struct MeasurementTime {
  unsigned long startTime = 360; // Start time in minutes since midnight
  unsigned long endTime = 1320;   // End time in minutes since midnight
} measurementTimeOfDay;

// Flags and time tracking variables
bool takeMeasurement = false;
bool validRange = false;
unsigned long lastMeasurementPrompted = 0;
unsigned long dataAge = 0;
unsigned long timeOfLastStoredMeasurement = 0;
unsigned long timeout = 5 * 60 * 1000; // Timeout period for measurement (5 minutes)
unsigned long lastBlinkMillis = 0; // Time since last LED blink
const long blinkInterval = 500; // Interval for blinking LED
static bool connectedToCloud = false; // Flag to indicate if device is connected to Particle cloud
static bool waitingForFinger = false;  // Flag to indicate if device is waiting for finger placement
static unsigned long startWaitingTime = 0; // Time when device started waiting for finger placement

unsigned long lastUnixTime = 0; // Last known Unix time
unsigned long lastMillis = 0; // Last time measured by millis()

// Setup function - initializes the system
void setup()
{
  // Register Particle functions for remote control
  Particle.function("flashGreenLED", flashGreenLED);
  Particle.function("updateMeasurementPeriod", updateMeasurementPeriod);
  Particle.function("updateMeasurementTimeofDay", updateMeasurementTimeofDay);

  // Initialize serial communication
  Serial.begin(115200);
  Serial.println("Initializing...");

  // Set up LEDs as output
  pinMode(takeMeasurementLED, OUTPUT);
  pinMode(yellowLED, OUTPUT);
  pinMode(greenLED, OUTPUT);

  // Initialize MAX30105 sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST))
  {
    Serial.println("MAX30105 was not found. Please check wiring/power.");
    while (1); // Infinite loop if sensor is not found
  }

  // Set up the sensor with specific settings
  byte ledBrightness = 60; // LED brightness level
  byte sampleAverage = 4; // Number of samples to average
  byte ledMode = 2; // 2 = Red only, 3 = Red + IR, 7 = Red + IR + Green
  byte sampleRate = 100; // Sample rate (samples per second)
  int pulseWidth = 411; // Pulse width (time for each sample)
  int adcRange = 4096; // ADC range (resolution)

  // Apply sensor settings
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  // Clear stale data from file
  void cleanUpDataFile();

  // Set up time zone
  Time.zone(-7);  
}

// Main loop of the program
void loop()
{
  // Calculate current time in minutes since midnight
  unsigned long currentTimeInMinutes = getCurrentTime();
  
  // Check if current time is within the measurement window
  if (currentTimeInMinutes >= measurementTimeOfDay.startTime && currentTimeInMinutes < measurementTimeOfDay.endTime) 
  {
    // Calculate age of stored data
    dataAge = millis() - timeOfLastStoredMeasurement;
    if (dataAge >= ONE_DAY_MILLIS) 
    {
      // Clear stale data if older than 24 hours
      Serial.println("Stored data is older than 24 hours. Clearing stale data from file...");
      cleanUpDataFile();
      timeOfLastStoredMeasurement = millis();
    }
    // Check if device is connected to Particle cloud 
    if (Particle.connected() && !connectedToCloud)
    {
      // Handle Wi-Fi connection and data publishing
      Serial.println("Wi-Fi connected.");
      if (storageFileHasContents("/data.txt")) {
        Serial.println("Publishing stored data from file...");
        publishStoredDataFromFile();
      }
      else {
        Serial.println("No stored data in file.");
      }
      connectedToCloud = true;
    }
    // Check if it's time to take a new measurement
    if (!takeMeasurement && ((lastMeasurementPrompted == 0) || (millis() - lastMeasurementPrompted > measurementPeriod))) 
    {
      // Set flags to initiate measurement
      takeMeasurement = true;
      waitingForFinger = true;
      startWaitingTime = millis();
      Serial.println("Please place your index finger on the sensor.");
      lastMeasurementPrompted = millis();
    }

    // Handle finger placement timeout
    if (waitingForFinger) 
    {
      if (millis() - startWaitingTime >= timeout) 
      {
        Serial.println("Timeout: 5 minutes elapsed without a measurement.");
        takeMeasurement = false;
        waitingForFinger = false;
        digitalWrite(takeMeasurementLED, LOW); // Turn off LED after timeout
        lastMeasurementPrompted = millis(); // Reset timer for next measurement
      } else 
      {
        // Check if finger is placed on sensor
        long irValue = particleSensor.getIR();
        if (irValue >= 50000) 
        {
          waitingForFinger = false;
          Serial.println("Taking measurement now ...");
          digitalWrite(takeMeasurementLED, LOW); // Turn off LED
          // Proceed with measurement
        } else {
          // Blink LED while waiting for finger placement
          if (millis() - lastBlinkMillis > blinkInterval) 
          {
            digitalWrite(takeMeasurementLED, !digitalRead(takeMeasurementLED));
            lastBlinkMillis = millis();
          }
        }
      }
    }

    // Take measurement if conditions are met
    if (takeMeasurement && !waitingForFinger) 
    {
      bufferLength = 100;

      // Collect sensor data
      for (byte i = 0; i < bufferLength; i++) 
      {
        while (particleSensor.available() == false)
          particleSensor.check();

        redBuffer[i] = particleSensor.getRed();
        irBuffer[i] = particleSensor.getIR();
        particleSensor.nextSample();
      }
       
      // Calculate heart rate and SpO2
      maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

      // Check if readings are valid
      validRange = (spo2 > 50) && (spo2 < 101) && (heartRate > 30 ) && (heartRate < 300);
      if (validSPO2 && validHeartRate && validRange) 
      {
        printSensorData(heartRate, validHeartRate, spo2, validSPO2);
        // Prepare data for publishing
        String currentTime = Time.format(TIME_FORMAT_ISO8601_FULL);
        String data = String::format("{\"heartrate\":%d,\"spo2\":%d", heartRate, spo2);
        if (Particle.connected()) 
        {
          // Publish data if connected to Wi-Fi
          data = String::format("%s,\"measurementTime\":\"%s\"}", data.c_str(), currentTime.c_str());
          publishData(data);
        } else 
        {
          // Store data locally if not connected to Wi-Fi
          data = String::format("%s%s", data.c_str(), "}");
          storeDataLocallyToFile(data, millis(), yellowLED);
          connectedToCloud = false;
          timeOfLastStoredMeasurement = millis();
        }
        takeMeasurement = false;
      } else 
      {
        // Handle invalid reading
        Serial.println(F("Invalid reading. Please ensure your finger is properly placed on the sensor and remain still."));
      }
      lastMeasurementPrompted = millis(); // Reset timer for next measurement
    }
  }
}


// Function: updateMeasurementPeriod
// This function updates the measurement period for a monitoring system.
// Input: 
//   - period (String): A string representation of the desired measurement period in minutes.
// Process:
//   - Converts the string input to an unsigned long integer.
//   - Multiplies the converted value by 60 and 1000 to convert minutes to milliseconds.
//   - Updates a global variable 'measurementPeriod' to this new value in milliseconds.
//   - Prints messages to the serial port to indicate the update process and the new period.
// Output: 
//   - Returns an integer (1) to indicate successful execution of the function.
//
int updateMeasurementPeriod(String period) {
  unsigned long measurementPeriodInt = period.toInt(); // Convert String to unsigned long
  measurementPeriod = measurementPeriodInt * 60 * 1000; // Update the global variable
  Serial.println("============================================================================");
  Serial.println("Measurement period updated!");
  Serial.printf("New measurement period: %lu ms\n", measurementPeriod); // Use the global variable
  Serial.println("============================================================================");

  return 1; // Indicate success
}


// Function: updateMeasurementTimeofDay
// This function updates the start and end times for measurements taken during a specific time of day.
// Input:
//   - jsonString (String): A JSON-formatted string containing start and end times.
// Process:
//   - Parses the JSON string to extract 'startTime' and 'endTime' values.
//   - Iterates through the JSON object to find these values.
//   - Converts the time values from String to a numerical format (assumed to be minutes since midnight).
//   - Updates global structure 'measurementTimeOfDay' with these numerical values.
//   - Prints the updated times to the serial port.
// Output:
//   - Returns an integer (1) to indicate successful update, or (-1) to indicate failure due to invalid JSON format.
//
int updateMeasurementTimeofDay(String jsonString) {
    JSONValue outerObj = JSONValue::parseCopy(jsonString);
    JSONObjectIterator iter(outerObj);
    Serial.println("============================================================================");
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
        
        Serial.println("Measurement Time of Day updated!");
        Serial.printf("New Start Time: %lu minutes, End Time: %lu minutes\n", 
                    measurementTimeOfDay.startTime, measurementTimeOfDay.endTime);
        Serial.println("============================================================================");
        return 1; // Indicate success
    } else {
        Serial.println("Invalid JSON format");
        return -1; // Indicate failure
    }
}



