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

//uint16_t* homeAsBuf = (uint16_t*)&sHome;

void setup() {
  mySerial.begin(9600);
  slave.start();
  pinMode(SSerialTxControl, OUTPUT);

  Serial.begin(9600);
  sHome.initConfig(0x1, 12, 0, 0, 0x3, 0x0);
  sHome.setAllData(0);
}

void loop() {
  // unsigned long time = millis() / 1000;
  // au16data[1] = time;

  if (sHome.configIsChanged()) {
    //    Serial.println("--Config chng");
    sHome.setupPins();
  } else if (sHome.pinsAreChanged()) {
    //      debug.log("--Data changed (%ld):", sHome.data.getDataBits());
    //    debug.log("--Pins chng:", sHome.pin_bits);
    sHome.copyData();
  } else if (sHome.dataIsChanged()) {
    //      debug.log("--Data changed (%ld):", sHome.bits);
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
  /*
   if (millis() % 1000 < 10) {

  Serial.print(sHome.d_maskRead);  //0.
  Serial.print(sHome.d_maskWrite); //1.
  Serial.print(sHome.a_maskWrite);  //3.
  Serial.print(sHome.d_copyOffset);  //4. 4 bits per each address, 8 pins supported in total
  Serial.print(sHome.a_copyOffset);  //6.
  Serial.print(sHome.reserved1);  //8
  Serial.print(sHome.reserved2);  //10
  Serial.print(sHome.reserved3);  //12
  Serial.print(sHome.reserved4);  //14
Serial.print(",");  //16.
  Serial.print(sHome.bits);  //16.
  Serial.print(sHome.pin_bits); //17.
   
   Serial.println();
  
*/
  //  Serial.print("--");
  //  Serial.print(state);
}