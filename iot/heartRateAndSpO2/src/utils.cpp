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
  Serial.println("published !!");
}

// Function to store data locally to a file
void storeDataLocallyToFile(const String &data, const int ledPin) {
  Serial.println();
  Serial.println("Storing data locally to file...");
  int fd = open("/data.txt", O_RDWR | O_CREAT | O_APPEND);
  if (fd < 0) {
    Serial.println("Failed to open file");
    return;
  }

  int bytesWritten = write(fd, data.c_str(), data.length());
  write(fd, "\n", 1); // Add a newline character to separate entries
  flashLED(ledPin, 4, 200); // Flash LED to indicate data stored locally
  close(fd);

  if (bytesWritten < static_cast<int>(data.length())) {
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

  // Split the dataInEEPROM into lines and process each line
  char *line = strtok(storedData, "\n");

  while (line != NULL) {
    
    Serial.println("Publishing data...");
    // Print the line to serial for debugging (optional)
    Serial.println(line);
    
    publishData(line);

    // Move to the next line
    line = strtok(NULL, "\n");
  }

  close(fd);

  // Clear the contents of the file
  fd = open("/data.txt", O_TRUNC);
  close(fd);

  Serial.println("Stored data published and file cleared.");
}
