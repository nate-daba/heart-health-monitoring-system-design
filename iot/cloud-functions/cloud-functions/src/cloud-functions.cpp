/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#include "Particle.h"
#line 1 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/cloud-functions/cloud-functions/src/cloud-functions.ino"
// name the pins
void setup();
void loop();
int ledControl(String command);
#line 2 "/Users/natnaeldaba/Documents/Documents/Academia/UofA/Third_semester/ECE_513_Web_dev_and_IoT/final_project/heart-rate-monitoring-system-design/iot/cloud-functions/cloud-functions/src/cloud-functions.ino"
int ledPin = D4;

SYSTEM_THREAD(ENABLED);

void setup()
{
   // Configure the pins to be outputs
   pinMode(ledPin, OUTPUT);

   // Initialize both the LEDs to be OFF
   digitalWrite(ledPin, LOW);

   // Register our Particle function here
   Particle.function("led", ledControl);
}

void loop()
{
   // Do nothing here, just run in a tight loop.
}

// This function is called when the Particle Cloud receives the command
int ledControl(String command)
{
   int state = LOW;

   // find out the state of the led
   if(command == "HIGH"){
	   state = HIGH;
   }else if(command == "LOW"){ 
	   state = LOW;
   }else{
	   return -1;
   }

   // write to the appropriate pin
   digitalWrite(ledPin, state);
   return 1;
}

