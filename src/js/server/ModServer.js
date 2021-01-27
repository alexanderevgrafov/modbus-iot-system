const _ = require('lodash');
const ModbusRTU = require('modbus-serial');
const SerialPort = require('serialport');

class ModServer {
  master = null;
  serialPort = null;
  allComPorts = [];

  init() {
    return SerialPort.list()
      .then(ports => {
        this.allComPorts = _.map(ports, port => _.pick(port, ['path', 'manufacturer']));
        this.master = new ModbusRTU();
      });
  }

  getPortsList() {
    return this.allComPorts;
  }

  setComPort(port) {
    this.serialPort = port;

    return new Promise((resolve, reject) => {
      try {
        if (port) {
          this.master.connectRTUBuffered(port, {baudRate: 9600}, resolve);
          this.log("Port is changed to " + port);
        } else {
          this.master.close(resolve);
          this.log("Port is disconnected");
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

module.exports =  ModServer;
