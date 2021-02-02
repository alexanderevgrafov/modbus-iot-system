const _ = require('lodash');
const ModbusRTU = require('modbus-serial');
const SerialPort = require('serialport');

class ModServer {
  master = null;
  serialPort = null;
  allComPorts = [];

  init() {
    this.master = new ModbusRTU();
    return Promise.resolve();
  }

  async getPortsList() {
    return await SerialPort.list()
    .then(ports => _.map(ports, port => _.pick(port, ['path', 'manufacturer'])))
  }

  setComPort(port) {
    console.log("compare:",this.serialPort, port);
    if (this.serialPort === port) {
      this.log("Port is not changed");
      return Promise.resolve(); 
    }

    return new Promise((resolve, reject) => {
      const portChange = ()=>{
        this.serialPort = port;
         this.log("Port is " + (port || 'closed'));
        resolve();
      }
      const connectorFunc = () =>{
         if (port) {
            this.master.connectRTUBuffered(port, {baudRate: 9600}, portChange)
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

module.exports =  ModServer;
