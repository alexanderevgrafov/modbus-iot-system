#include <Arduino.h>
#include <EEPROM.h>

#define MY_SERIAL 0

#define SSerialTxControl 2

#if MY_SERIAL > 0
#define MY_SERIAL_RX 3
#define MY_SERIAL_TX 4
#include <SoftwareSerial.h>
#endif

#include "SmartHomeStruct.h"

#define EEPROM_STORAGE_ADDR 0
#define EEPROM_STORAGE_BYTES 20

#if MY_SERIAL > 0
SoftwareSerial mySerial(MY_SERIAL_RX, MY_SERIAL_TX);
Modbus slave(DEFAULT_SLAVE_ID, mySerial, SSerialTxControl);
#else
Modbus slave(DEFAULT_SLAVE_ID, Serial, SSerialTxControl);
#endif

SmartHomeStruct sHome;

void saveToEEPROM() {
  uint16_t crcFact = 0;

  for (byte i = 0; i < EEPROM_STORAGE_BYTES; i++) {
    uint8_t byte = ((uint8_t*)&sHome.config)[i];
    EEPROM.write(EEPROM_STORAGE_ADDR + i, byte);
  }

  crcFact = CRC16.ccitt((uint8_t*)&sHome.config, EEPROM_STORAGE_BYTES);
  EEPROM.put(EEPROM_STORAGE_ADDR + EEPROM_STORAGE_BYTES, crcFact);
}

bool restoreFromEEPROM() {
  uint8_t buff[EEPROM_STORAGE_BYTES];
  uint16_t crcRead = 0;
  uint16_t crcFact = 0;

  for (byte i = 0; i < EEPROM_STORAGE_BYTES; i++) {
    buff[i] = EEPROM.read(EEPROM_STORAGE_ADDR + i);
  }
  crcFact = CRC16.ccitt(buff, EEPROM_STORAGE_BYTES);
  EEPROM.get(EEPROM_STORAGE_ADDR + EEPROM_STORAGE_BYTES, crcRead);

  if (crcFact == crcRead) {
    memcpy(&sHome.config, buff, EEPROM_STORAGE_BYTES);
  }

  return (crcFact == crcRead);
}

void setup() {
#if MY_SERIAL > 0
  mySerial.begin(9600);
#else
  Serial.begin(9600);
#endif

  pinMode(SSerialTxControl, OUTPUT);

  slave.start();

  if (!restoreFromEEPROM()) {
    sHome.initConfig(0x1, 12, 0, 0, 0x3, 0x0);
  }

// Please mind - data is not stored in EEPROM so its always virgin after reset. Server takes care for restoring data on data bits.
  sHome.setAllData(0);

  sHome.onConfigChange(&slave); // Required to init board by loaded config

  sHome.configIsChanged();  // Required to init crc
  sHome.dataIsChanged();    // Required to init crc
}

void loop() {
  unsigned long time = millis() / 1000;

  if (!(time % 5)) {
    if (sHome.configIsChanged()) {
      sHome.onConfigChange(&slave);
      saveToEEPROM();
 //     debug.log("--Conf is changed");
    }
  }
  if (sHome.pinsAreChanged()) {
    sHome.copyData();
  } else if (sHome.dataIsChanged()) {
    //      debug.log("--Data changed (%ld):", sHome.bits);
    sHome.writePins();
  } else {
    sHome.readPins();
  }

  // delay(10);
  slave.poll((uint16_t*)&sHome, sizeof(sHome));
}
