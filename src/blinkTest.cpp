#include <Arduino.h>
#include <SoftwareSerial.h>

#include "ModbusRtu.h"

#define SSerialTxControl 3

#define RS485Transmit HIGH
#define RS485Receive LOW

String string;
int8_t state = 0;

SoftwareSerial mySerial(2, 4);

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(SSerialTxControl, OUTPUT);
  Serial.begin(9600);
  mySerial.begin(9600);
  
}

void loop()
{
  int time = millis() / 1000;

  //  bitWrite( au16data[0], 0, time % 2); //Lee el pin 2 de Arduino y lo guarda en el bit 0 de la variable au16data[0]
  
   digitalWrite(SSerialTxControl, RS485Receive);

   Serial.print('.');
   if (mySerial.available()) {
       Serial.write( mySerial.read());
   }

  delay(100);
}