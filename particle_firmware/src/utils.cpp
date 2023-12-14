#include "Particle.h"
#include "utils.h"
#include <fcntl.h>

// Function to get the current time in ISO8601 format
const int dataSize = 512;

// Function: flashLED
// This function controls an LED to flash a specified number of times.
// Inputs:
//   - ledPin (byte): The pin number where the LED is connected.
//   - count (int): The number of times the LED should flash.
//   - delayMillis (int): The duration in milliseconds for which the LED stays on or off during each flash.
// Process:
//   - Iterates 'count' times, turning the LED on and off with a delay between each state change.
//   - Uses digitalWrite to set the LED pin HIGH (on) and LOW (off).
//   - Delays are added after setting the LED state to control the duration of on/off states.
// Output:
//   - No return value (void function). It visually indicates the operation through the LED's flashes.
//
void flashLED(byte ledPin, int count, int delayMillis) {
  for (int i = 0; i < count; i++) {
    digitalWrite(ledPin, HIGH);
    delay(delayMillis);
    digitalWrite(ledPin, LOW);
    delay(delayMillis);
  }
}

// Function: flashGreenLED
// This function flashes a green LED based on the status of data storage in a database.
// Input:
//   - dataStoredInDbSuccessfully (String): A string indicating the success status of data storage ("true", "false", or other).
// Process:
//   - Checks if the data was successfully stored in the database (string equals "true").
//   - If successful, it calls flashLED to flash the green LED 4 times.
//   - If unsuccessful (string equals "false"), it prints a message and does not flash the LED.
//   - For invalid input (any string other than "true" or "false"), it prints an error message.
// Output:
//   - Returns an integer (1 for success, 0 for failure, -1 for invalid input).
//
int flashGreenLED(String dataStoredInDbSuccessfully) {
    
    if(dataStoredInDbSuccessfully == "true") {
        flashLED(D4, 4, 200);
        return 1;
    } else if(dataStoredInDbSuccessfully == "false") {
        Serial.println("Data not stored in db");
        return 0;
    } else {
        Serial.println("Invalid argument");
        return -1;
    }
}

// Function: publishData
// This function publishes sensor data to a cloud service using Particle's publish method.
// Input:
//   - data (String): The sensor data to be published.
// Process:
//   - Calls Particle.publish to send the data to a cloud service, with the event name "sensorData" and privacy set to PRIVATE.
//   - Prints a message to the serial port indicating whether the data was successfully published.
// Output:
//   - Returns a boolean value (true if successful, false otherwise).
//
bool publishData(String data) {
  bool success = Particle.publish("sensorData", data, PRIVATE);
  if (!success) {
    Serial.println("Failed to publish data.");
  }
  else {
    Serial.println(" published !!");
  }
  return success;
}

// Function: storeDataLocallyToFile
// This function stores sensor data to a local file, appending the current time in milliseconds.
// Inputs:
//   - data (const String &): The sensor data to be stored.
//   - measurementMillis (unsigned long): The current time in milliseconds.
//   - ledPin (const int): The pin number where the LED is connected.
// Process:
//   - Formats the sensor data and the time in milliseconds into a single string.
//   - Opens (or creates if not exist) a file named "data.txt" for writing in append mode.
//   - Writes the formatted data to the file.
//   - Flashes an LED to indicate data storage activity.
//   - Closes the file.
//   - Prints messages to the serial port indicating the success or failure of file operations.
// Output:
//   - No return value (void function). Results are indicated through serial prints and LED flashes.
//
void storeDataLocallyToFile(const String &data, unsigned long measurementMillis, const int ledPin) {
  Serial.println("\nStoring data locally to file...");
  String dataWithMillis = String::format("%s,%lu\n", data.c_str(), measurementMillis); // Append millis to the data string

  int fd = open("/data.txt", O_RDWR | O_CREAT | O_APPEND);
  if (fd < 0) {
    Serial.println("Failed to open file");
    return;
  }

  int bytesWritten = write(fd, dataWithMillis.c_str(), dataWithMillis.length());
  flashLED(ledPin, 4, 200); // Flash LED to indicate data stored locally
  close(fd);

  if (bytesWritten < static_cast<int>(dataWithMillis.length())) {
    Serial.println("Failed to write data completely");
  } else {
    Serial.println("Data stored locally to file.");
  }
}

// Function: storageFileHasContents
// This function checks if a given file has any content.
// Input:
//   - filename (const char*): The name of the file to check.
// Process:
//   - Opens the file in read-only mode.
//   - Uses lseek to move to the end of the file and determine its size.
//   - Closes the file.
//   - Checks if the file size is greater than zero.
// Output:
//   - Returns a boolean value (true if the file has contents, false if it's empty or couldn't be opened).
//
bool storageFileHasContents(const char* filename) {
  int fd = open(filename, O_RDONLY); // Open the file for reading
  if (fd < 0) {
    Serial.println("Failed to open file");
    return false; // File opening failed
  }

  off_t fileSize = lseek(fd, 0, SEEK_END); // Seek to the end of file to get the size
  close(fd); // Close the file descriptor

  if (fileSize > 0) {
    Serial.println("File has contents.");
    return true; // File has contents
  } else {
    Serial.println("File is empty or does not exist.");
    return false; // File is empty or the seek failed
  }
}

// Function: publishStoredDataFromFile
// This function reads data from a file and publishes it.
// Process:
//   - Opens a file "/data.txt" in read-only mode.
//   - Reads data from the file into a buffer.
//   - Iterates over each line in the buffer.
//   - For each line, it extracts the data and timestamp, formats them, and publishes them.
//   - Keeps track of any failures in publishing the data.
//   - Closes the file.
//   - If all data is published successfully, it clears the file; otherwise, it leaves the file as is.
// Output:
//   - No return value (void function). The results are indicated through serial prints and actions on the file.
//
void publishStoredDataFromFile() {

  char storedData[dataSize];
  int fd = open("/data.txt", O_RDONLY);

  if (fd < 0) {
    Serial.println("Failed to open file");
    return;
  }
  
  Serial.println("Reading from file...");
  int bytesRead = read(fd, storedData, dataSize);

  if (bytesRead < 0) {
    Serial.println("Failed to read file");
    close(fd);
    return;
  }

  storedData[bytesRead] = '\0'; // Null-terminate the dataInEEPROM array

  char *line = strtok(storedData, "\n");
  int failureCount = 0;
  while (line != NULL) {
    // Parse the line to separate data and millis
    String dataLine = String(line);
    int commaIndex = dataLine.lastIndexOf(',');
    String data = dataLine.substring(0, commaIndex);
    unsigned long storedMillis = dataLine.substring(commaIndex + 1).toInt();

    // Compute the actual measurement time
    String actualTime = computeActualTime(storedMillis);
    int closingBraceIndex = data.lastIndexOf('}');
    data = data.substring(0, closingBraceIndex);
    // Format the data with the actual time
    String formattedData = String::format("%s,\"measurementTime\":\"%s\"}",
                                          data.c_str(), actualTime.c_str());

    Serial.printf("Publishing formatted data: %s", formattedData.c_str());

    // Publish the data
    bool success = publishData(formattedData);
    if (!success) {
      failureCount++;
    }

    // Move to the next line
    line = strtok(NULL, "\n");
  }

  close(fd);

  if (failureCount > 0) {
    Serial.printf("Failed to publish %d data points. File not cleared.\n", failureCount);
  } else {
    Serial.println("All data published successfully.");
    cleanUpDataFile();
  }
}

// Function: computeActualTime
// This function computes the actual time of a measurement based on stored milliseconds.
// Input:
//   - storedMillis (unsigned long): The time in milliseconds when the data was stored.
// Process:
//   - Calculates the current time in seconds since the Unix epoch.
//   - Adjusts this time based on the difference between the current millis and storedMillis.
//   - Converts this adjusted time into an ISO8601 formatted string.
// Output:
//   - Returns a String representing the adjusted time in ISO8601 format.
//
String computeActualTime(unsigned long storedMillis) {
  unsigned long currentTime = millis();
  time_t now = Time.now();
  time_t adjustedTime = now - ((currentTime - storedMillis) / 1000);
  return Time.format(adjustedTime, TIME_FORMAT_ISO8601_FULL);
}

// Function: printSensorData
// This function prints the sensor data values for heart rate and SpO2 (oxygen saturation) along with their validity status.
// Inputs:
//   - heartRate (int32_t): The heart rate value measured by the sensor.
//   - validHeartRate (int8_t): An indicator of whether the heart rate value is valid (typically 1 for valid, 0 for invalid).
//   - spo2 (int32_t): The SpO2 value measured by the sensor.
//   - validSPO2 (int8_t): An indicator of whether the SpO2 value is valid (typically 1 for valid, 0 for invalid).
// Process:
//   - Prints each piece of data (heart rate and SpO2) and their validity to the serial console in a human-readable format.
// Output:
//   - No return value (void function). The output is sent to the serial console.
//
void printSensorData(int32_t heartRate, int8_t validHeartRate, int32_t spo2, int8_t validSPO2) {
  Serial.print(F("HR="));
  Serial.print(heartRate, DEC);

  Serial.print(F(", HRvalid="));
  Serial.print(validHeartRate, DEC);

  Serial.print(F(", SPO2="));
  Serial.print(spo2, DEC);

  Serial.print(F(", SPO2Valid="));
  Serial.print(validSPO2, DEC);
  
}

// Function: parseTimeToMinutes
// This function converts a time string in HH:MM format to the total number of minutes since midnight.
// Input:
//   - timeStr (String): The time in "HH:MM" format.
// Process:
//   - Extracts the hour and minute from the string.
//   - Converts these values to integers.
//   - Calculates the total minutes by multiplying the hour by 60 and adding the minutes.
// Output:
//   - Returns an unsigned long representing the total number of minutes since midnight.
//
unsigned long parseTimeToMinutes(String timeStr) {
  int hour = timeStr.substring(0, 2).toInt();
  int minute = timeStr.substring(3, 5).toInt();
  return hour * 60 + minute;
}

// Function: cleanUpDataFile
// This function clears the contents of the data file used for storing sensor data.
// Process:
//   - Opens the file "/data.txt" with the truncate option (O_TRUNC) to clear its contents.
//   - Closes the file.
//   - Prints a message to the serial console indicating that the file has been cleared.
// Output:
//   - No return value (void function). The result is indicated through the serial print statement.
//
void cleanUpDataFile() {
  // Clear stale data from file
  int fd = open("/data.txt", O_TRUNC);
  close(fd);
  Serial.println("Cleared data from file.");
}

// Function: getCurrentTime
// This function retrieves the current system time and converts it into minutes since midnight.
// Process:
//   - Uses the Time.hour() function to get the current hour of the day.
//   - Uses the Time.minute() function to get the current minute of the hour.
//   - Calculates the total minutes since midnight by multiplying the hour by 60 and adding the minutes.
// Output:
//   - Returns an unsigned long representing the total number of minutes since midnight.
//
unsigned long getCurrentTime() {
  // Get the current hour and minute
  int currentHour = Time.hour();
  int currentMinute = Time.minute();
  // Convert the current time to minutes since midnight
  return currentHour * 60 + currentMinute;
}







