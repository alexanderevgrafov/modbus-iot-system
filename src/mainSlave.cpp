#include <Arduino.h>
#include <SoftwareSerial.h>

#include "ModbusRtu.h"

#define SSerialTxControl 2 

#define RS485Transmit    HIGH
#define RS485Receive     LOW

String string;

int8_t state = 0;
// data array for modbus network sharing
uint16_t au16data[16] = {
  11, 22, 33, 44, 55, 7182, 28182, 8, 0, 0, 0, 0, 0, 0, 1, 0 };
// the setup function runs once when you press reset or power the board
SoftwareSerial mySerial(3, 4);
Modbus slave(14, mySerial, SSerialTxControl); // this is master and RS-232 or USB-FTDI via software serial


void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(SSerialTxControl, OUTPUT);
 Serial.begin(9600);
  mySerial.begin(9600);
  slave.start();

// slave.begin(9600);
 

}


// the loop function runs over and over again forever
void loop() {

  int time = millis() / 1000; 
  
//  bitWrite( au16data[0], 0, time % 2); //Lee el pin 2 de Arduino y lo guarda en el bit 0 de la variable au16data[0] 
 digitalWrite(SSerialTxControl, RS485Receive); 
/*
   if (mySerial.available()) {      // If anything comes in Serial (USB),
    Serial.write(mySerial.read());   // read it and send it out Serial1 (pins 0 & 1)
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  } else  {
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW

  }
*/

/*
 if (mySerial.available()) {      // If anything comes in Serial (USB),
    Serial.write(mySerial.read());   // read it and send it out Serial1 (pins 0 & 1)
  }

    mySerial.println('Hellow');
  */
 /*
 digitalWrite(SSerialTxControl, RS485Transmit); 
mySerial.println(time/2);
Serial.println(time);

delay(2000);
 */
au16data[1] = time;

  state = slave.poll( au16data, 16 );

//Serial.print("State=");
//  Serial.println(state);

/*
  if (Serial.available())
  {
    //string = Serial.readString();
    Serial.print("norm=");
        Serial.print(Serial.read()); 
    //Serial.print(string);
  }
*/
/*
  if (mySerial.available())
  {
//    string = mySerial.readString();
    Serial.print("my=");
  //  Serial.print(string);
    Serial.print(mySerial.read()); 
  }
*/
//Serial.print('.');

 delay(100);
/*
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(1000);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(1000);                       // wait for a second
  */
}


/*
#include <Tiny_ModBusRTU_Slave.h>
#include <TimerOne.h>


int pushButton = 2;
unsigned int regTable[10];
Tiny_ModBusRTU_Slave slave(1, 80, regTable, 10); // создаем объект, адрес 1, таймаут 4 мс, массив regTable, размер 10

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);

  Timer1.initialize(500); // инициализация таймера 1, период 500 мкс
  Timer1.attachInterrupt(timerInterrupt, 500); // задаем обработчик прерываний
  Serial.begin(9600);
  pinMode(pushButton, INPUT);
}

void loop() {

  int buttState = digitalRead(pushButton);
  //Serial.println(regTable[1]);
  //   delay(100);

  regTable[0] = (unsigned int)buttState;
  if (buttState) {
    digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  } else {                  // wait for a second
    digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW      prevState = buttState;
  }

  delay(5);

}

// обработчик прерывания
void timerInterrupt() {
  slave.update();
}
*/