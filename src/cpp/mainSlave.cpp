#include <Arduino.h>
#include <SoftwareSerial.h>

#include "ModbusRtu.h"
//#include "MyDebug.h"
#include "SmartHomeStruct.h"

#define SSerialTxControl 3

#define RS485Transmit HIGH
#define RS485Receive LOW

String string;
int8_t state = 0;

uint16_t au16data[16] = {11, 22, 33, 44, 55, 7182, 28182, 8,
                         0, 0, 0, 0, 0, 0, 1, 0};

//-SoftwareSerial mySerial(2, 4);
//-Modbus slave(14, mySerial, SSerialTxControl);

SmartHomeStruct sHome;

void setup() {
  Serial.begin(9600);

  sHome.initConfig(0x1, 12, 0x0, 0x0, 0x3, 0x0);
  sHome.data.setAllData(0);

  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(SSerialTxControl, OUTPUT);
}

void loop() {
  unsigned long time = millis() / 1000;

  au16data[1] = time;

  if (sHome.configIsChanged()) {
    Serial.println("--Config changed, pins setup");
    sHome.setupPins();
  } else if (sHome.dataIsChanged()) {
  //  debug.log("--Data changed", sHome.data.getDataBits());
    sHome.copyData();

    if (sHome.dataIsChanged()) {
      sHome.writePins();
    }
  } else {
    Serial.print(".");
    delay(500);

    // if (rand() < RAND_MAX / 4) {
    //   byte bit = rand() < RAND_MAX / 2 ? 1 : 0;
    //   byte addr = rand() < RAND_MAX / 2 ? 1 : 0;
    //   sHome.data.setBit(addr, bit);
    // }

    sHome.readPins();
  }

  //-  state = slave.poll(au16data, 16);
  // Serial.print(time);
  // Serial.print("--");
  // Serial.print(state);
}