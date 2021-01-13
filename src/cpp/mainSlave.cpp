#include <Arduino.h>
#include <SoftwareSerial.h>

#include "ModbusRtu.h"
//#include "MyDebug.h"
#include "SmartHomeStruct.h"

#define SSerialTxControl 3

//#define RS485Transmit HIGH
//#define RS485Receive LOW

//String string;
int8_t state = 0;

SoftwareSerial mySerial(2, 4);
Modbus slave(14, mySerial, SSerialTxControl);

SmartHomeStruct sHome;

void setup() {
  mySerial.begin(9600);
  slave.start();
    pinMode(SSerialTxControl, OUTPUT);

  Serial.begin(9600);
  sHome.initConfig(0x1, 12, 0x3, 0x4, 0x3, 0x0);
  sHome.setAllData(0);
}

void loop() {
  //unsigned long time = millis() / 1000;
 // au16data[1] = time;

  if (sHome.configIsChanged()) {
    Serial.println("--Config changed, pins setup");
    sHome.setupPins();
  } else if (sHome.pinsAreChanged()) {
//      debug.log("--Data changed (%ld):", sHome.data.getDataBits());
    debug.log("--Pins changed (%ld):", sHome.pin_bits);
    sHome.copyData();
  } else if (sHome.dataIsChanged()) {
      debug.log("--Data changed (%ld):", sHome.bits);
      sHome.writePins();
  } else {
    // Serial.print(".");
    // delay(500);

    // if (rand() < RAND_MAX / 4) {
    //   byte bit = rand() < RAND_MAX / 2 ? 1 : 0;
    //   byte addr = rand() < RAND_MAX / 2 ? 1 : 0;
    //   sHome.data.setBit(addr, bit);
    // }

    sHome.readPins();
  }

  //((uint16_t*)&sHome)[7] = time;
   //state = slave.poll(au16data, 16);
   state = slave.poll((uint16_t*)&sHome, sizeof(sHome));
  //  Serial.print(time);
  //  Serial.print("--");
  //  Serial.print(state);
}