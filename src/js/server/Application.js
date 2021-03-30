const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const BoardsManager = require('./models/BoardManager');
const PluginsManager = require('./models/PluginsManager');
const ModServer = require('./models/ModServer');
const SerialPort = require('serialport');
const Json5 = require('json5');
const config = require('./config');
const fastify = require('fastify')({
  //  logger: true
})

const io = require('socket.io')({
  cors: {
    origin: '*',
  },
});

class Application {
  async init() {
    const state = await this.loadSystemState();

    this.serialPorts = await this.getPortsList();

    this.modServer = new ModServer();
    await this.modServer.init(state, this);

    this.boardsManager = BoardsManager.create();
    this.boardsManager.init(state, this);

    this.pluginsManager = new PluginsManager(state, this);

    this.pluginsManager.initAll();

    this.webserverSetup();

    return Promise.resolve(this);
  }

  async getPortsList() {
    return await SerialPort.list()
      .then(ports => _.map(ports, port => _.pick(port, ['path', 'manufacturer'])))
  }

  async loadSystemState() {
    let data;

    try {
      data = Json5.parse(fs.readFileSync(config.CONFIG_STORAGE_FILE));
    } catch (e) {
      this.handleError('Config file not found or broken, using default empty');
      data = {};
    }

    return data;
  }

  getFullStateJson() {
    const port = this.modServer.serialPort;
    const ports = this.serialPorts;
    const boards = this.boardsManager.getBoardsJson();
    const layout = this.pluginsManager.getFullLayout();

    return {port, ports, boards, layout};
  }

  saveSystemState() {
    const data = {
      port: this.modServer.serialPort,
      boards: this.boardsManager.getBoardsJson(),
      plugins: this.pluginsManager.getPluginsJson(),
    }

    fs.writeFileSync(config.CONFIG_STORAGE_FILE, Json5.stringify(data, null, 2))
    console.log('Saved as', config.CONFIG_STORAGE_FILE);
  }

  webserverSetup() {
    fastify
      .register(require('fastify-static'), {
        root: path.join(__dirname, config.PUBLIC_PATH),
      })
      .register(require('./api-server'), {app: this})

    console.log(`Listens on ${config.LISTEN_HOST}:${config.SERVER_PORT}`);

    fastify.listen(config.SERVER_PORT, config.LISTEN_HOST, function (err, address) {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
      fastify.log.info(`server listening on ${address}`)
    })

    io.on('connection', socket => {
      console.log('Socket IO client is connected');
      /*

            const socketApiMap = socketApi(this);

            _.each(socketApiMap, (method, name) => {
              socket.on(name, data => {
                try {
                  method(data);
                } catch (e) {
                  this.handleError(e);
                }
              })
            })

       */
    })


    io.listen(config.WS_SERVER_PORT);
    console.log('Socket IO server on', config.WS_SERVER_PORT);

    //TODO: change this to 'Emit after all clients are connected'
    setTimeout(()=>    this.emit('stateReload'), 3000);
  }

  emit(command, data, comment) {
    const count = io.sockets.size;

    if (count) {
      io.sockets.emit(command, data);

      comment && console.log('Emit', command, 'to', count);
    }

    return count;
  }

  handleError(e) {
    console.error('SERVER ERROR:', e.message || e);
  }

  log(msg) {
    console.log(msg);
  }
}

module.exports = Application;
