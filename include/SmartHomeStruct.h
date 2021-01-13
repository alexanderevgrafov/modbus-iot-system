#include <inttypes.h>

#include "Arduino.h"
#include "FastCRC.h"
#include "MyDebug.h"

enum PIN_TYPE { PIN_DIGITAL = 0,
                PIN_ANALOG = 1 };

enum PIN_MODE { PIN_READABLE = 0,
                PIN_WRITABLE = 1 };

FastCRC16 CRC16;
MyDebug debug;

#define STARTING_DIGITAL_PIN 5
#define STARTING_ANALOG_PIN 14

//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
class SmartHomeStruct {
 private:
 public:
  uint16_t d_maskRead;    //0.
  uint16_t d_maskWrite;   //1.
  uint16_t a_maskRead;    //2.
  uint16_t a_maskWrite;   //3.
  uint32_t d_copyOffset;  //4. 4 bits per each address, 8 pins supported in total
  uint32_t a_copyOffset;  //6.
  uint32_t reserved1;     //8
  uint32_t reserved2;     //10
  uint32_t reserved3;     //12
  uint32_t reserved4;     //14

  uint16_t bits;      //16.
  uint16_t pin_bits;  //17.

  uint16_t words[8];      //18. supported 8 analog pins
  uint16_t pin_words[8];  //26. reservation for possible future
  uint16_t reserved[16];  //34. reservation for possible future

  uint16_t lastConfigCrc;
  uint16_t lastDataCrc;
  uint16_t lastPinsCrc;

  void initConfig(uint16_t d_maskRead, uint16_t d_maskWrite,
                  uint16_t a_maskRead, uint16_t a_maskWrite,
                  uint32_t d_copyOffset, uint32_t a_copyOffset);
  void setupPins();

  bool isPin(PIN_MODE pinMode, PIN_TYPE pinType, uint8_t index);

  // uint16_t getDataBits() { return this->bits; }
  // uint16_t *getDataWords() { return this->words; }
  void setAllData(uint16_t bits /*, uint16_t * words*/);
  void setBit(uint16_t *bits, uint8_t bit, uint8_t val);
  //void setWord(uint8_t bit, uint16_t val);

  void readPins();
  void copyData();
  void writePins();

  uint16_t configCrc();

  bool hasChanged(uint16_t *lastCrc, uint16_t crc, bool updateLastCrc);
  bool configIsChanged();
  bool dataIsChanged();
  bool pinsAreChanged();
};

//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=

void SmartHomeStruct::setupPins() {
  for (int i = 0; i < 8; i++) {
    if (this->isPin(PIN_READABLE, PIN_DIGITAL, i)) {
      pinMode(STARTING_DIGITAL_PIN + i, INPUT);
      //debug.log("dPin %d is set IN", STARTING_DIGITAL_PIN + i);
    }
    if (this->isPin(PIN_WRITABLE, PIN_DIGITAL, i)) {
      pinMode(STARTING_DIGITAL_PIN + i, OUTPUT);
      //debug.log("dPin %d is set OUT", STARTING_DIGITAL_PIN + i);
    }
    if (this->isPin(PIN_READABLE, PIN_ANALOG, i)) {
      pinMode(STARTING_ANALOG_PIN + i, INPUT);
      //debug.log("aPin %d is set IN", STARTING_ANALOG_PIN + i);
    }
    if (this->isPin(PIN_WRITABLE, PIN_ANALOG, i)) {
      pinMode(STARTING_ANALOG_PIN + i, OUTPUT);
      //    debug.log("aPin %d is set OUT", STARTING_ANALOG_PIN + i);
    }
  }
}

void SmartHomeStruct::readPins() {
  uint16_t data;
  uint8_t pin;

  for (int i = 0; i < 8; i++) {
    if (this->isPin(PIN_READABLE, PIN_DIGITAL, i)) {
      pin = STARTING_DIGITAL_PIN + i;
      data = digitalRead(pin);
      //   debug.log("Coil %ld data read = %ld", pin, data);
      this->setBit(&this->pin_bits, i, data);
    }
    // if (this->isPin(PIN_READABLE, PIN_ANALOG, i)) {
    //   pin = STARTING_ANALOG_PIN + i;
    //   data = analogRead(pin);
    //   debug.log("Analog %ld data read = %ld", pin, data);
    // }
  }
}
void SmartHomeStruct::writePins() {
  // uint16_t bits = this->getDataBits();
  //  uint16_t *words = this->getDataWords();
  uint8_t data;
  uint8_t pin;

  for (int i = 0; i < 8; i++) {
    if (this->isPin(PIN_WRITABLE, PIN_DIGITAL, i)) {
      pin = STARTING_DIGITAL_PIN + i;
      //   Serial.print("[");
      //   Serial.print(bits);
      //   Serial.print("|");
      //   Serial.print(1 << i);
      //         Serial.print("|");
      //   Serial.print(bits & (1 << i));

      data = (this->bits & (1 << i)) ? 1 : 0;
      //         Serial.print("|");
      //   Serial.print(data);
      //   Serial.print("] ");
      //   debug.log("Set coil: %ld %ld %ld", i, bits, data);

      digitalWrite(pin, data);
      //debug.log("Coil %ld is SET as %ld", pin, data);
    }
    // if (this->isPin(PIN_WRITABLE, PIN_ANALOG, i)) {
    //   pin = STARTING_ANALOG_PIN + i;
    //   digitalWrite(pin, words[i]);
    //   debug.log("Analog %ld is SET as %ld", pin, words[i]);
    // }
  }
}
void SmartHomeStruct::copyData() {
  //uint16_t bits = this->getDataBits();
  // uint16_t *words = this->getDataWords();

  //   debug.log("Start bits copy routine %ld", bits);

  for (int i = 0; i < 8; i++) {
    int8_t addr = this->d_copyOffset >> (i * 4) & 0xF;

    if (addr) {
      addr = i + (addr & 0x7) * (addr & 0x8 ? -1 : 1);

      if (addr >= 0 && addr < 8) {
        this->setBit(&this->bits, addr, this->pin_bits & (1 << i) ? 1 : 0);
      } else {
        //        debug.log("Digital copy addr %ld is out of range (%ld)", i, addr);
      }
    }

    // TODO: implement Analog words copying....
  }

  //   debug.log("After data copy we have %ld", this->getDataBits());
}

void SmartHomeStruct::initConfig(uint16_t d_maskRead, uint16_t d_maskWrite,
                                 uint16_t a_maskRead, uint16_t a_maskWrite,
                                 uint32_t d_copyOffset, uint32_t a_copyOffset) {
  this->d_maskRead = d_maskRead;
  this->d_maskWrite = d_maskWrite;
  this->a_maskRead = a_maskRead;
  this->a_maskWrite = a_maskWrite;

  this->d_copyOffset = d_copyOffset;
  this->a_copyOffset = a_copyOffset;
}

uint16_t SmartHomeStruct::configCrc() {
  uint16_t buf[8] = {this->d_maskRead,
                     this->d_maskWrite,
                     this->a_maskRead,
                     this->a_maskWrite,
                     (uint16_t)(this->d_copyOffset >> 16),
                     (uint16_t)(this->d_copyOffset),
                     (uint16_t)(this->a_copyOffset >> 16),
                     (uint16_t)(this->a_copyOffset)};

  return CRC16.ccitt((uint8_t *)buf, 16);
}

bool SmartHomeStruct::isPin(PIN_MODE pinMode, PIN_TYPE pinType,
                            uint8_t index) {
  uint16_t mask;

  if (index > 7) {
    return false;
  }

  mask = pinMode == PIN_READABLE
             ? (pinType == PIN_DIGITAL ? this->d_maskRead : this->a_maskRead)
             : (pinType == PIN_DIGITAL ? this->d_maskWrite : this->a_maskWrite);

  return (1 << index & mask);
};

void SmartHomeStruct::setAllData(uint16_t bits /*, uint16_t * words*/) {
  this->bits = bits;
  // TOO: Words is not yet implemented
}
void SmartHomeStruct::setBit(uint16_t *bits, uint8_t bit, uint8_t val) {
  if (val) {
    *bits |= 1 << bit;
  } else {
    *bits &= 0xFF ^ (1 << bit);
  }
}
// void SmartHomeStruct::setWord(uint8_t bit, uint16_t val) {
//   // TODO: implement
// }

bool SmartHomeStruct::hasChanged(uint16_t *lastCrc, uint16_t crc, bool updateLastCrc) {
  if (*lastCrc == crc) {
    return false;
  }

  if (updateLastCrc) {
    *lastCrc = crc;
  }
  return true;
}

bool SmartHomeStruct::configIsChanged() {
  return this->hasChanged(&this->lastConfigCrc, this->configCrc(), true);
}

bool SmartHomeStruct::dataIsChanged() {
  return this->hasChanged(&this->lastDataCrc, this->bits, true);
}

bool SmartHomeStruct::pinsAreChanged() {
  return this->hasChanged(&this->lastPinsCrc, this->pin_bits, true);
}