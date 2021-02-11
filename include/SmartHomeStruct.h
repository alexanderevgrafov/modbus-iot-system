#include <inttypes.h>

#include "Arduino.h"
#include "FastCRC.h"
#include "ModbusRtu.h"
//#include "MyDebug.h"

#define DEFAULT_TYPE_ID 1
#define DEFAULT_SLAVE_ID 222

#define STARTING_DIGITAL_PIN 5
#define STARTING_ANALOG_PIN 14

enum PIN_TYPE { PIN_DIGITAL = 0,
                PIN_ANALOG = 1 };

enum PIN_MODE { PIN_READABLE = 0,
                PIN_WRITABLE = 1 };

FastCRC16 CRC16;
//MyDebug debug;

struct SmartHomeConfig {
  uint32_t reserved0;     //1. 1- because there is one word before config struct
  uint16_t typeID;        //3 
  uint16_t slaveID;       //4
  uint16_t startingPin;   //5.
  uint16_t d_maskRead;    //6.
  uint16_t d_maskWrite;   //7.
  uint16_t a_maskRead;    //8.
  uint16_t a_maskWrite;   //9.
  uint32_t d_copyOffset;  //10. 4 bits per each address, 8 pins supported in total
  uint32_t a_copyOffset;  //12.
  uint32_t reserved1;     //14
  uint32_t reserved2;     //16
  uint32_t reserved3;     //18
};

struct SmartHomeData {
  uint16_t bits;
  uint16_t pin_bits;

  uint16_t words[8];      //18. supported 8 analog pins
  uint16_t pin_words[8];  //26. reservation for possible future
  uint16_t reserved[16];  //34. reservation for possible future
};

//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
class SmartHomeStruct {
 private:
 public:
  uint16_t dataOffset;
  SmartHomeConfig config;
  SmartHomeData data;

  uint16_t lastConfigCrc;
  uint16_t lastDataCrc;
  uint16_t lastPinsCrc;

  SmartHomeStruct();
  void initConfig(uint16_t d_maskRead, uint16_t d_maskWrite,
                  uint16_t a_maskRead, uint16_t a_maskWrite,
                  uint32_t d_copyOffset, uint32_t a_copyOffset);
  void onConfigChange(Modbus *);

  bool isPin(PIN_MODE pinMode, PIN_TYPE pinType, uint8_t index);

  // uint16_t getDataBits() { return this->data.bits; }
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
SmartHomeStruct::SmartHomeStruct() {
  this->dataOffset = sizeof(SmartHomeConfig) / 2 + 1;
  this->config.slaveID = DEFAULT_SLAVE_ID;
  this->config.typeID = DEFAULT_TYPE_ID;
  this->config.startingPin = STARTING_DIGITAL_PIN;
}

void SmartHomeStruct::onConfigChange(Modbus *slave) {
  uint8_t pin;
  for (int i = 0; i < 8; i++) {
    pin = this->config.startingPin + i;

    if (this->isPin(PIN_READABLE, PIN_DIGITAL, i)) {
      pinMode(pin, INPUT);
      //debug.log("dPin %d is set IN", STARTING_DIGITAL_PIN + i);
    }
    if (this->isPin(PIN_WRITABLE, PIN_DIGITAL, i)) {
      pinMode(pin, OUTPUT);
      //debug.log("dPin %d is set OUT", STARTING_DIGITAL_PIN + i);
    }
//    if (this->isPin(PIN_READABLE, PIN_ANALOG, i)) {
//      pinMode(STARTING_ANALOG_PIN + i, INPUT);
//      //debug.log("aPin %d is set IN", STARTING_ANALOG_PIN + i);
//    }
//    if (this->isPin(PIN_WRITABLE, PIN_ANALOG, i)) {
//      pinMode(STARTING_ANALOG_PIN + i, OUTPUT);
//      //    debug.log("aPin %d is set OUT", STARTING_ANALOG_PIN + i);
//    }
  }

  slave->setID(this->config.slaveID);
}

void SmartHomeStruct::readPins() {
  uint16_t data;
  uint8_t pin;

  for (int i = 0; i < 8; i++) {
    if (this->isPin(PIN_READABLE, PIN_DIGITAL, i)) {
      pin = this->config.startingPin + i;
      data = digitalRead(pin);
      //   debug.log("Coil %ld data read = %ld", pin, data);
    } else {
      data = 0;
    }

    this->setBit(&this->data.pin_bits, i, data);
    // if (this->isPin(PIN_READABLE, PIN_ANALOG, i)) {
    //   pin = STARTING_ANALOG_PIN + i;
    //   data = analogRead(pin);
    //   debug.log("Analog %ld data read = %ld", pin, data);
    // }
  }
}

void SmartHomeStruct::writePins() {
  uint8_t data;
  uint8_t pin;

  for (int i = 0; i < 8; i++) {
    if (this->isPin(PIN_WRITABLE, PIN_DIGITAL, i)) {
      pin = this->config.startingPin + i;
      //   Serial.print("[");
      //   Serial.print(bits);
      //   Serial.print("|");
      //   Serial.print(1 << i);
      //         Serial.print("|");
      //   Serial.print(bits & (1 << i));

      data = (this->data.bits & (1 << i)) ? 1 : 0;
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
   //  debug.log("Start bits copy routine");

  for (int i = 0; i < 8; i++) {
    int8_t addr = this->config.d_copyOffset >> (i * 4) & 0xF;

    if (addr) {
      uint16_t srcSet = this->isPin(PIN_READABLE, PIN_DIGITAL, i) ? this->data.pin_bits : this->data.bits;
      bool bb = (bool)(srcSet & (1 << i));
      addr = i + (addr & 0x7) * (addr & 0x8 ? -1 : 1);

// debug.log("#:%d, Addr:%d, ==%d", i, addr, (byte)bb);

      if (addr >= 0 && addr < 8) {
        this->setBit(&this->data.bits, addr, bb ? 1 : 0);
      } else {
        //        debug.log("Digital copy addr %ld is out of range (%ld)", i, addr);
      }
    }
    // TODO: implement Analog words copying....
  }
  //   debug.log("After data copy we have %ld", this->data.bits);
}

void SmartHomeStruct::initConfig(uint16_t d_maskRead, uint16_t d_maskWrite,
                                 uint16_t a_maskRead, uint16_t a_maskWrite,
                                 uint32_t d_copyOffset, uint32_t a_copyOffset) {
  this->config.d_maskRead = d_maskRead;
  this->config.d_maskWrite = d_maskWrite;
  this->config.a_maskRead = a_maskRead;
  this->config.a_maskWrite = a_maskWrite;

  this->config.d_copyOffset = d_copyOffset;
  this->config.a_copyOffset = a_copyOffset;
}

uint16_t SmartHomeStruct::configCrc() {
  uint16_t buf[10] = {this->config.slaveID,
                     this->config.startingPin,
                     this->config.d_maskRead,
                     this->config.d_maskWrite,
                     this->config.a_maskRead,
                     this->config.a_maskWrite,
                     (uint16_t)(this->config.d_copyOffset >> 16),
                     (uint16_t)(this->config.d_copyOffset),
                     (uint16_t)(this->config.a_copyOffset >> 16),
                     (uint16_t)(this->config.a_copyOffset)};

  return CRC16.ccitt((uint8_t *)buf, sizeof(buf));
}

bool SmartHomeStruct::isPin(PIN_MODE pinMode, PIN_TYPE pinType, uint8_t index) {
  uint16_t mask;

  if (index > 7) {
    return false;
  }

  mask = pinMode == PIN_READABLE
             ? (pinType == PIN_DIGITAL ? this->config.d_maskRead : this->config.a_maskRead)
             : (pinType == PIN_DIGITAL ? this->config.d_maskWrite : this->config.a_maskWrite);

  return (1 << index & mask);
};

void SmartHomeStruct::setAllData(uint16_t bits /*, uint16_t * words*/) {
  this->data.bits = bits;
  // TODO: Words is not yet implemented
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
  return this->hasChanged(&this->lastDataCrc, this->data.bits, true);
}

bool SmartHomeStruct::pinsAreChanged() {
  return this->hasChanged(&this->lastPinsCrc, this->data.pin_bits, true);
}
