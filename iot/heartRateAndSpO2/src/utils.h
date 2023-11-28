#ifndef UTILS_H
#define UTILS_H

#include "Particle.h"

// Function to flash an LED a specified number of times with a given delay
// void flashLED(byte ledPin, int count, int delayMillis);

// Function to publish data and flash an LED to indicate data published
void publishData(String data);

void storeDataLocallyToFile(const String &data, unsigned long measurementMillis, const int ledPin);

void publishStoredDataFromFile();

int flashGreenLED(String dataStoredInDbSuccessfully);

bool storageFileHasContents(const char* filename);

String computeActualTime(unsigned long storedMillis);

void printSensorData(int32_t heartRate, int8_t validHeartRate, int32_t spo2, int8_t validSPO2);

int updateMeasurementPeriod(String measurementPeriod);

unsigned long parseTimeToMinutes(String timeStr);

int updateMeasurementTimeofDay(String jsonString);

#endif
