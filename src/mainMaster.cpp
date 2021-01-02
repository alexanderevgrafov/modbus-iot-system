#include <Arduino.h>
#include <SoftwareSerial.h>
#include "ModbusRtu.h"
//#include <LiquidCrystal_I2C.h>
//#include <Wire.h>

#define SSerialTxControl 13
#define RS485Transmit HIGH
#define RS485Receive LOW

#define POLL_PERIOD 500

uint16_t au16data[16];
uint8_t u8state;

int pushButton = 2;

////int buttState = 0;
//int prevState = 0;

//LiquidCrystal_I2C lcd(0x3f, 16, 2); // Устанавливаем дисплей
SoftwareSerial mySerial(3, 5);
Modbus master(0, mySerial, SSerialTxControl);

modbus_t telegram;
unsigned long u32wait;

unsigned int regTable[10];
char buff[10];
String string;

void setup()
{

  Serial.begin(9600);
  mySerial.begin(9600);
 // lcd.init();
 // lcd.backlight(); // Включаем подсветку дисплея

  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(SSerialTxControl, OUTPUT);
  //  pinMode(pushButton, INPUT);

  master.start();
  u32wait = millis() + 1000;
  u8state = 0;

  au16data[0] = 0;
}

void loop()
{

  //    buttState = digitalRead(pushButton);

  //    if (buttState != prevState) {
  // if (buttState || regTable[0]) {
  //      digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  // } else {                  // wait for a second
  //      digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW      prevState = buttState;
  // }

  //      master.writeSingle(1, (unsigned int)buttState, 0); // запись регистра хранения (светодиод)
  //          master.read(1, regTable, 0, 2);
  /*
      while(master.state == 1) {
              Serial.print(".");
        } // ожидание данных
        */
  // if(master.state != 0) errorCount++;

  // Выводим на экран количество секунд с момента запуска ардуины
  //     Serial.println();
  unsigned long seconds = millis() / 1000;

  //lcd.setCursor(0, 0);
  //lcd.print(seconds);



//  lcd.setCursor(0, 1);
//  lcd.print(u8state);
/*
  lcd.setCursor(6, 0);
  lcd.print(master.getErrCnt());
  lcd.print(",");
  lcd.print(master.getLastError());
  lcd.print(";");
*/

  switch (u8state)
  {
  case 0:
    if (millis() > u32wait)
      u8state++; // wait state
    break;
  case 1:
    telegram.u8id = 14;          // slave address
    telegram.u8fct = 4;          // function code (this one is registers read)
    telegram.u16RegAdd = 1;      // start address in slave
    telegram.u16CoilsNo = 1;     // number of elements (coils or registers) to read
    telegram.au16reg = au16data; // pointer to a memory array in the Arduino

////    digitalWrite(SSerialTxControl, RS485Transmit);
    master.query(telegram); // send query (only once)
    u8state++;
    break;
  case 2:
 //   digitalWrite(SSerialTxControl, RS485Receive);
    master.poll(); // check incoming messages
    if (master.getState() == COM_IDLE)
    {
      u8state = 0;
      u32wait = millis() + POLL_PERIOD;
      /*
      lcd.setCursor(0, 1);
      lcd.print(au16data[0]);
      lcd.print(",");
      lcd.print(master.getOutCnt());
      */
      Serial.print(seconds);
      Serial.print("; ");
      Serial.print(au16data[0]);
      Serial.print("; ");
      Serial.print(master.getOutCnt());
Serial.println(".");
    }
    break;
  }

  //digitalWrite(SSerialTxControl, RS485Transmit);
  //mySerial.println(seconds);

  //delay(50);

  /*
      master.writeSingle(1, (unsigned int)buttState, 0); // запись регистра хранения с адресом 5, контроллера с адресом 1
      
      prevState = buttState;
    }
*/

}
