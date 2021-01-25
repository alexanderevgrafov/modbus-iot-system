const _ = require('lodash');
const ModbusRTU = require("modbus-serial");
const SerialPort = require("serialport");

class ModServer {
  master = null;
  serialPort = null;
  allPorts = [];

  async constructor() {
    const ports = await SerialPort.list();
    this.allPorts = _.map(ports, port=>_.pick(port, ["path", "manufacturer"]));
    this.master = new ModbusRTU();
  }

  getPortsList(){
    return this.allPorts;
  }

  setPort(port) {
    this.serialPort = port;
    this.master.connectRTUBuffered(port, { baudRate: 9600 }, () => {
      console.log('---------------SerialPort:', port);
   //   master.setID(14);
      this.master.setTimeout(4000);
    });
  }
}

export default ModServer;
