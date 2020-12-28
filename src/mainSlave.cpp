#include <Arduino.h>
#include <SoftwareSerial.h>

#include "ModbusRtu.h"

#define SSerialTxControl 2

#define RS485Transmit HIGH
#define RS485Receive LOW

String string;
int8_t state = 0;

uint16_t au16data[16] = {11, 22, 33, 44, 55, 7182, 28182, 8, 0, 0, 0, 0, 0, 0, 1, 0};

SoftwareSerial mySerial(3, 4);
Modbus slave(14, mySerial, SSerialTxControl);

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(SSerialTxControl, OUTPUT);
  Serial.begin(9600);
  mySerial.begin(9600);
  slave.start();
}

void loop()
{
  int time = millis() / 1000;

  //  bitWrite( au16data[0], 0, time % 2); //Lee el pin 2 de Arduino y lo guarda en el bit 0 de la variable au16data[0]
  // digitalWrite(SSerialTxControl, RS485Receive);

  au16data[1] = time;

  state = slave.poll(au16data, 16);

  delay(100);
}