#include "Particle.h"
#include "utils.h"
#include <fcntl.h>

// Function to get the current time in ISO8601 format
const int dataSize = 512;

void flashLED(byte ledPin, int count, int delayMillis) {
  for (int i = 0; i < count; i++) {
    digitalWrite(ledPin, HIGH);
    delay(delayMillis);
    digitalWrite(ledPin, LOW);
    delay(delayMillis);
  }
}

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

// Function to store data locally to a file, with millis value
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

// Function to publish stored data from the file
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

// Helper function to compute actual time from stored millis
String computeActualTime(unsigned long storedMillis) {
  unsigned long currentTime = millis();
  time_t now = Time.now();
  time_t adjustedTime = now - ((currentTime - storedMillis) / 1000);
  return Time.format(adjustedTime, TIME_FORMAT_ISO8601_FULL);
}

// Function to print sensor data
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

// Function to parse the time in HH:MM format and convert it to minutes since midnight
unsigned long parseTimeToMinutes(String timeStr) {
  int hour = timeStr.substring(0, 2).toInt();
  int minute = timeStr.substring(3, 5).toInt();
  return hour * 60 + minute;
}

// Function to clear the data file
void cleanUpDataFile() {
  // Clear stale data from file
  int fd = open("/data.txt", O_TRUNC);
  close(fd);
  Serial.println("Cleared data from file.");
}

// function to get current time (return unsigned long)
unsigned long getCurrentTime() {
  // Get the current hour and minute
  int currentHour = Time.hour();
  int currentMinute = Time.minute();
  // Convert the current time to minutes since midnight
  return currentHour * 60 + currentMinute;
}






