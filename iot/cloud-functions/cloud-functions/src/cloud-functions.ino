// name the pins
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

