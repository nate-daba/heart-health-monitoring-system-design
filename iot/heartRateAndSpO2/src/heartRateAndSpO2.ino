/*
  Optical SP02 Detection (SPK Algorithm) using the MAX30105 Breakout
  By: Nathan Seidle @ SparkFun Electronics
  Date: October 19th, 2016
  https://github.com/sparkfun/MAX30105_Breakout

  This demo shows heart rate and SPO2 levels.

  It is best to attach the sensor to your finger using a rubber band or other tightening 
  device. Humans are generally bad at applying constant pressure to a thing. When you 
  press your finger against the sensor it varies enough to cause the blood in your 
  finger to flow differently which causes the sensor readings to go wonky.

  This example is based on MAXREFDES117 and RD117_LILYPAD.ino from Maxim. Their example
  was modified to work with the SparkFun MAX30105 library and to compile under Arduino 1.6.11
  Please see license file for more info.

  Hardware Connections (Breakoutboard to Arduino):
  -5V = 5V (3.3V is allowed)
  -GND = GND
  -SDA = A4 (or SDA)
  -SCL = A5 (or SCL)
  -INT = Not connected
 
  The MAX30105 Breakout can handle 5V or 3.3V I2C logic. We recommend powering the board with 5V
  but it will also run at 3.3V.
*/

#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

#include "heartRate.h"

// Allows us to use our particle device without Wi-Fi connection.
SYSTEM_THREAD(ENABLED);

MAX30105 particleSensor;

#define MAX_BRIGHTNESS 255

uint32_t irBuffer[100]; //infrared LED sensor data
uint32_t redBuffer[100];  //red LED sensor data

int32_t bufferLength; //data length
int32_t spo2; //SPO2 value
int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
int32_t heartRate; //heart rate value
int8_t validHeartRate; //indicator to show if the heart rate calculation is valid

byte takeMeasurementLED = D7; // Blinks with each data read
unsigned long measurementPeriod = 60000; // Frequency of asking user to take measurement
bool takeMeasurement = false; // Flag to indicate if we should take a measurement
unsigned long lastMeasurementPrompted = 0; // Time since last measurement prompt 
unsigned long timeout = 5 * 60 * 1000;  // 5 minutes in milliseconds
unsigned long lastBlinkMillis = 0; // will store last time LED was updated
const long blinkInterval = 500;    // interval at which to blink (milliseconds)

void setup()
{
  Serial.begin(115200); // initialize serial communication at 115200 bits per second
  Serial.println("Initializing...");

  pinMode(takeMeasurementLED, OUTPUT); //set as output to control LED

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) //Use default I2C port, 400kHz speed
  {
    Serial.println("MAX30105 was not found. Please check wiring/power. ");
    while (1);
  }

  byte ledBrightness = 60; //Options: 0=Off to 255=50mA
  byte sampleAverage = 4; //Options: 1, 2, 4, 8, 16, 32
  byte ledMode = 2; //Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
  byte sampleRate = 100; //Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
  int pulseWidth = 411; //Options: 69, 118, 215, 411
  int adcRange = 4096; //Options: 2048, 4096, 8192, 16384

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); //Configure sensor with these settings

}

void loop()
{
  if ((lastMeasurementPrompted == 0) || (millis() - lastMeasurementPrompted > measurementPeriod)) 
  {
    takeMeasurement = true;
    Serial.println("Please place your index finger on the sensor.");
    lastMeasurementPrompted = millis();
    long irValue = particleSensor.getIR();
    
    while(irValue < 50000 && (millis() - lastMeasurementPrompted < timeout)) 
    {
      if(millis() - lastBlinkMillis > blinkInterval) 
      {
        // Only toggle the LED when the blink interval has passed
        digitalWrite(takeMeasurementLED, !digitalRead(takeMeasurementLED));
        lastBlinkMillis = millis(); // Update the last blink time
      }
      irValue = particleSensor.getIR(); // Check the sensor value again
    }
    
    digitalWrite(takeMeasurementLED, LOW); // Turn off LED

    if ((millis() - lastMeasurementPrompted) >= timeout) 
    {
      // Handle timeout: 5 minutes elapsed without a measurement
      Serial.println("Timeout: 5 minutes elapsed without a measurement.");
      takeMeasurement = false;
    }
    else 
    {
      Serial.println("Taking measurement now ...");
      // Continue with measurement
    }
    // Update lastMeasurementPrompted regardless of whether a measurement was taken or timed out
    lastMeasurementPrompted = millis();
  } 

  if(takeMeasurement)
  {  
    bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

    //read the first 100 samples, and determine the signal range
    for (byte i = 0 ; i < bufferLength ; i++)
    {
      while (particleSensor.available() == false) //do we have new data?
        particleSensor.check(); //Check the sensor for new data

      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample(); //We're finished with this sample so move to next sample
    }

    //calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
    maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
    // report measurement results to serial monitor
    Serial.print(F("HR="));
    Serial.print(heartRate, DEC);

    Serial.print(F(", HRvalid="));
    Serial.print(validHeartRate, DEC);

    Serial.print(F(", SPO2="));
    Serial.print(spo2, DEC);

    Serial.print(F(", SPO2Valid="));
    Serial.println(validSPO2, DEC);

    takeMeasurement = false;
  }
}


