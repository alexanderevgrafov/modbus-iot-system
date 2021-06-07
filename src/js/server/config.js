const defaults = {
  SERVER_PORT: 8888,
  LISTEN_HOST: '127.0.0.1',
  PUBLIC_PATH: '/../../../public',
  CONFIG_STORAGE_FILE: 'configStorage.json.ok',
  SERIAL_BAUDRATE: 9600,
  MODBUS_TIMEOUT: 2500,
  SLAVE_ID_ADDR: 4,
  WS_SERVER_PORT: 567,
  MAX_MODBUS_QUEUE_SIZE: 10,
}

const dotenv = require('dotenv').config().parsed;
const config = Object.assign({}, defaults, process.env, dotenv || {});

//console.log(config, dotenv, process.env );

module.exports=config;

