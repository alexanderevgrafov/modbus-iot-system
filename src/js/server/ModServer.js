const _ = require('lodash');
const fs = require('fs');
const ModbusRTU = require('modbus-serial');
const SerialPort = require('serialport');
const config = require('./config');

class ModServer {
  master = null;
  serialPort = null;
  modbusCalls = 0;

  brd_data = 0;  // very tmp storage for board data (works only with one board in system)
  brd_addr = 0;
  getDataPin(pin) {
    return this.brd_data & (1<<pin); // TODO: не забыть учитывать starting-pin
  }

  setDataPin(pin, val){
    if (!!val) {
      this.brd_data |= (1<<pin); // TODO: не забыть учитывать starting-pin
    } else {
      this.brd_data &= 0xFF^(1<<pin); // TODO: не забыть учитывать starting-pin
    }

    return this.brd_data;
  }

  async init() {
    const state = await this.getSystemState();
    this.master = new ModbusRTU();

    if (state.port) {
      await this.setComPort(state.port);
    }

    return Promise.resolve();
  }

  waitModbusIdle() {
    if (!this.modbusCalls) {
      return Promise.resolve();
    } else {
      return new Promise(res =>
        setTimeout(async () => {
          await this.waitModbusIdle();
          res();
        }, 200)
      );
    }
  }

  modbusQueue(slaveId, cb) {
    return this.waitModbusIdle()
      .then(() => this.modbusCalls++)
      .then(() => this.master.setID(parseInt(slaveId)))
      .then(cb)
      .finally(() => this.modbusCalls--)
  }

  async getSystemState() {
    const data = JSON.parse(fs.readFileSync(config.CONFIG_STORAGE_FILE));
    data.ports = await this.getPortsList();

    return data;
  }

  async setSystemState(data) {
    fs.writeFileSync(config.CONFIG_STORAGE_FILE, JSON.stringify(data))
  }

  async getPortsList() {
    return await SerialPort.list()
      .then(ports => _.map(ports, port => _.pick(port, ['path', 'manufacturer'])))
  }

  async getBoardConfig(id) {
    //------------------- we load from 0(zero) to include dataOffset word. Beware to load enough words to pick all meaningfull data.
    //console.log('Get config for', id)
    return await this.modbusQueue(id, () => this.master.readInputRegisters(0, 12))  
      .then(res => {
        const {data} = res;

       // this.brd_addr = parseInt(data[0]);

        return {
          read: data[6],
          write: data[7],
          addr: (data[11] << 16) | (data[10]),
          dataOffset: data[0],
          startingPin: data[5],
          typeId: data[3]
        }
      })
  }

  async getBoardData(id, addr) {
    const [pins, readPins] = await this.modbusQueue(parseInt(id), () => this.master.readHoldingRegisters(parseInt(addr), 2))
 //   const arr = await this.modbusQueue(parseInt(id), () => this.master.readHoldingRegisters(parseInt(addr)-4, 10))
      .then(x => x.data);
  //  console.log('Pins', pins, 'readPins', readPins);

  //  console.log('Arr', arr);

  //  return {pins:0, readPins:0};
    this.brd_data = parseInt(pins);
    
    return {pins, readPins};
  }

  async setBoardConfig({id, read, write, addr, bid, startingPin}) {
    const _addr = parseInt(addr);
    const words = [bid, startingPin, parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    await this.modbusQueue(parseInt(id), () => this.master.writeRegisters(config.SLAVE_ID_ADDR, words));
  }

  async setBoardData({id, pins, addr}) {
    this.brd_data = parseInt(pins);
    this.brd_addr = addr;
    const arr = [this.brd_data];

   // console.log(id, pins, addr);

    await this.modbusQueue(parseInt(id), () => this.master.writeRegisters(addr, arr))
  }

  async setBoardId(id, newid) {
    const arr = [parseInt(newid)];

    await this.modbusQueue(parseInt(id), () => this.master.writeRegisters(config.SLAVE_ID_ADDR, arr))

    return {id: newid};
  }

  setComPort(port) {
   // console.log('compare:', this.serialPort, port);
    if (this.serialPort === port) {
    //  this.log('Port is not changed');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const portChange = () => {
        this.serialPort = port;
        this.log('Port is ' + (port || 'closed'));
        resolve();
      }
      const connectorFunc = () => {
        if (port) {
          this.master.connectRTUBuffered(port, {baudRate: config.SERIAL_BAUDRATE}, portChange)
          this.master.setTimeout(500);
        } else {
          portChange();
        }
      }

      try {
        if (this.serialPort) {
          //         this.log("Closing port " + this.serialPort);
          this.master.close(connectorFunc);
        } else {
          connectorFunc();
        }
      } catch (e) {
        reject(e);
      }
    })
  }

  log(msg) {
    console.log(msg);
  }
}

module.exports = ModServer;
