const _ = require('lodash');
const fs = require('fs');
const ModbusRTU = require('modbus-serial');
const SerialPort = require('serialport');
const CONFIG_STORAGE_FILE = 'configStorage.json';

class ModServer {
  master = null;
  serialPort = null;
  allComPorts = [];

  async init() {
    const state = await this.getSystemState();
    this.master = new ModbusRTU();

    if (state.port) {
      await this.setComPort(state.port);
    }

    return Promise.resolve();
  }

  async getSystemState(){
    const data = JSON.parse(fs.readFileSync(CONFIG_STORAGE_FILE));
    data.ports = await this.getPortsList();

    return data;
  }

  async setSystemState(data){
    fs.writeFileSync(CONFIG_STORAGE_FILE, JSON.stringify(data))
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
