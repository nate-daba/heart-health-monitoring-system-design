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

void publishData(String data) {
  Particle.publish("sensorData", data, PRIVATE);
  Serial.println(" published !!");
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

    Serial.printlnf("Publishing formatted data: %s", formattedData.c_str());

    // Publish the data
    publishData(formattedData);

    // Move to the next line
    line = strtok(NULL, "\n");
  }

  close(fd);

  // Clear the contents of the file
  fd = open("/data.txt", O_TRUNC);
  close(fd);

  Serial.println("Stored data published and file cleared.");
}

// Helper function to compute actual time from stored millis
String computeActualTime(unsigned long storedMillis) {
  unsigned long currentTime = millis();
  time_t now = Time.now();
  time_t adjustedTime = now - ((currentTime - storedMillis) / 1000);
  return Time.format(adjustedTime, TIME_FORMAT_ISO8601_FULL);
}

