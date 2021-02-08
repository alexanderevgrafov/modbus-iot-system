const _ = require('lodash');
const fs = require('fs');
const ModbusRTU = require('modbus-serial');
const SerialPort = require('serialport');
const config = require('./config');

class ModServer {
  master = null;
  serialPort = null;
  modbusCalls = 0;

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
    return await this.modbusQueue(id, () => this.master.readInputRegisters(0, 11))  //we load from zero to include dataOffset word
      .then(res => {
        const {data} = res;

        return {
          read: data[3],
          write: data[4],
          addr: (data[8] << 16) | (data[7]),
          dataOffset: data[0],
          startingPin: data[2],
        }
      })
  }

  async getBoardData(id, addr) {
    const [pins, readPins] = await this.modbusQueue(parseInt(id), () => this.master.readHoldingRegisters(parseInt(addr), 2))
      .then(x => x.data);
    console.log('Pins', pins, 'readPins', readPins);

    return {pins, readPins};
  }

  async setBoardConfig({id, read, write, addr, bid, startingPin}) {
    const _addr = parseInt(addr);
    const words = [bid, startingPin, parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    await this.modbusQueue(parseInt(id), () => this.master.writeRegisters(1, words));
  }

  async setBoardData({id, pins, addr}) {
    const arr = [parseInt(pins)];

    await this.modbusQueue(parseInt(id), () => this.master.writeRegisters(addr, arr))
  }

  async setBoardId(id, newid) {
    const arr = [parseInt(newid)];

    await this.modbusQueue(parseInt(id), () => this.master.writeRegisters(config.SLAVE_ID_ADDR, arr))

    return {id: newid};
  }

  setComPort(port) {
    console.log('compare:', this.serialPort, port);
    if (this.serialPort === port) {
      this.log('Port is not changed');
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
