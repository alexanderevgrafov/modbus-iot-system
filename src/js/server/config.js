const defaults = {
  SERVER_PORT: 8888,
  LISTEN_HOST: '127.0.0.1',
  PUBLIC_PATH: '/../../../public',
  CONFIG_STORAGE_FILE: 'configStorage.json',
  SERIAL_BAUDRATE: 9600,
  SLAVE_ID_ADDR: 4,
}

const config = Object.assign({}, defaults, process.env, require('dotenv').config().parsed || {});

module.exports=config;
