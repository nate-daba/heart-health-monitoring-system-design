/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#include "Particle.h"
#line 1 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/blink-LED/src/blink-LED.ino"
/*
 * Project blink-LED
 * Description: blink an LED on and off
 * Author: Natnael Daba
 * Date: October 3, 2023
 */
void setup();
void loop();
#line 7 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/blink-LED/src/blink-LED.ino"
int light = D7; // This is where your LED is plugged in. The other side goes to a resistor connected to GND.
// setup() runs once, when the device is first turned on.
SYSTEM_THREAD(ENABLED);

void setup() {
  Serial.begin(115200); // initialize serial communication at 115200 bits per second:
  Serial.print("Initializing...");
  // Put initialization like pinMode and begin functions here.
  pinMode(light, OUTPUT);

}

// loop() runs over and over again, as quickly as it can execute.
void loop() {
  // The core of your code will likely live here.
  digitalWrite(light, HIGH);   // Turn ON the LED pins
  delay(1000);                       // Wait for 1000mS = 1 second
  digitalWrite(light, LOW);    // Turn OFF the LED pins
  delay(1000);                       // Wait for 1 second in off mode
  Serial.println("in the loop");
}