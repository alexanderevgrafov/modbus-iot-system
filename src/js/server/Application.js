const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const BoardsManager = require('./models/BoardManager');
const ModServer = require('./models/ModServer');
const SerialPort = require('serialport');
const config = require('./config');
const fastify = require('fastify')({
  //  logger: true
})
const modules = [
  require('./modules/pump'),
];

class Application {
  async init() {
    const state = await this.getSystemState();

    this.modServer = new ModServer();
    await this.modServer.init(state, this);

    this.boardsManager = BoardsManager.create();
    this.boardsManager.init(state, this);

    this.initModules(modules)

    this.webserverSetup();

    return Promise.resolve(this);
  }

  async getPortsList() {
    return await SerialPort.list()
      .then(ports => _.map(ports, port => _.pick(port, ['path', 'manufacturer'])))
  }

  async getSystemState() {
    let data;

    try {
      data = JSON.parse(fs.readFileSync(config.CONFIG_STORAGE_FILE));
    } catch (e) {
      console.log('Config file not found or broken, using default empty')
      data = {};
    }
    data.ports = await this.getPortsList();

    return data;
  }

  saveSystemState() {
    const data = {
      port: this.modServer.serialPort,
      boards: this.boardsManager.getBoardsJson(),
    }

    fs.writeFileSync(config.CONFIG_STORAGE_FILE, JSON.stringify(data, null, '  '))
  }

  initModules(modules) {
    _.each(modules, module => module.init(this.modServer))
  }

  webserverSetup() {
    fastify
      .register(require('fastify-static'), {
        root: path.join(__dirname, config.PUBLIC_PATH),
      })
      .register(require('./api-server'), {app:this})

    console.log(`Listens on ${config.LISTEN_HOST}:${config.SERVER_PORT}`);

    fastify.listen(config.SERVER_PORT, config.LISTEN_HOST, function (err, address) {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
      fastify.log.info(`server listening on ${address}`)
    })
  }

  log(msg) {
    console.log(msg);
  }
}

module.exports = Application;


