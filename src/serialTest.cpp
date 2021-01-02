#include <Arduino.h>
#include <SoftwareSerial.h>


String string;
int8_t state = 0;


SoftwareSerial mySerial(2, 4);


void setup()
{
  Serial.begin(9600);
  mySerial.begin(9600);

}

void loop()
{
  //unsigned long time = millis() / 1000;

  //  bitWrite( au16data[0], 0, time % 2); //Lee el pin 2 de Arduino y lo guarda en el bit 0 de la variable au16data[0]
  // digitalWrite(SSerialTxControl, RS485Receive);

   if (Serial.available()) {
       Serial.write(Serial.read());
   }

// Serial.print(time);
// Serial.print("--");
// Serial.print(state);
 delay(1000);
}