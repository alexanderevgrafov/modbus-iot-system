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

let io;

let fastifyRegistered = false;

class Application {
  isInitialised = false;

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

  async initRed({saveState, loadState}) {
    this.saveState = saveState;
    this.loadState = loadState;

    const state = await this.loadSystemState();

    this.serialPorts = await this.getPortsList();

    this.modServer = new ModServer();
    await this.modServer.init(state, this);

    this.boardsManager = BoardsManager.create();
    this.boardsManager.init(state, this);

    // Temporary support for plugins until node-red flow not established
    this.pluginsManager = new PluginsManager(state, this);
    this.pluginsManager.initAll();

    // At first we start webserver as part of central node - just to be фиде to configure everything 'old way'
    this.webserverSetup();

    this.isInitialised = true;

  //  this.saveSystemState();

    return this;
  }

  async destroy() {
    this.saveSystemState();
    await Promise.all([this.webserverClose(), this.modServer.destroy()]);
    console.log('Application destroyed');
  }

  async getPortsList() {
    return await SerialPort.list()
      .then(ports => _.map(ports, port => _.pick(port, ['path', 'manufacturer'])))
  }

  getState() {
    if (this.loadState) {
      const ret = this.loadState();
      if (ret) {
        return ret;
      }

      console.log('!!!!! Broken persistent state! Loading backup from file')
    }
    console.log('Read from', this.getConfigFileName());
    return fs.readFileSync(this.getConfigFileName());

  }

  setState(string) {
    if (this.saveState) {

     // console.log(this.saveState);
      this.saveState(string);
    } else {
      fs.writeFileSync(this.getConfigFileName(), string)
      console.log('Saved as', this.getConfigFileName());
    }
  }

  getConfigFileName() {
    return __dirname + '/../../../' + config.CONFIG_STORAGE_FILE;
  }

  loadSystemState() {
    let data;

    try {
      const text = this.getState() || '{}';

      data = Json5.parse(text);
    } catch (e) {
      console.log(e);
      console.log(__dirname);
      this.handleError('Config file not found or broken, using default empty');
      data = {};
    }

    return data;
  }

  saveSystemState() {
    const data = {
      port: this.modServer.serialPort,
      boards: this.boardsManager.getBoardsJson(),
      plugins: this.pluginsManager && this.pluginsManager.getPluginsJson(),
    }

    this.setState(Json5.stringify(data, null, 2));
  }

  // to be removed after config client will be switched to socket interface only
  getFullStateJson() {
    const port = this.modServer.serialPort;
    const ports = this.serialPorts;
    const boards = this.boardsManager.getBoardsJson();
    const layout = this.pluginsManager && this.pluginsManager.getFullLayout();

    return {port, ports, boards, layout};
  }

  webserverSetup() {
    io = require('socket.io')({
      cors: {
        origin: '*',
      },
    });

    if (!fastifyRegistered) {
      fastify
        .register(require('fastify-static'), {
          root: path.join(__dirname, config.PUBLIC_PATH),
        })
        .register(require('./api-server'), {app: this})
      fastifyRegistered = true;
    }

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
    })

    io.listen(config.WS_SERVER_PORT);
    console.log('Socket IO server on', config.WS_SERVER_PORT);

    //TODO: change this to 'Emit after all clients are connected'
    setTimeout(() => this.emit('stateReload'), 3000);
  }

  webserverClose() {
    return new Promise(resolve => {
      io.close(() => {
        console.log('IO socket is successfully closed!')

        fastify.close().then(() => {
          console.log('WWW server is successfully closed!');
          resolve();
        }, err => {
          console.log('An error happened', err);
          resolve();
        })
      });
    })
  }

  emit(command, data) {
    if (io) {
      io.sockets.emit(command, data);
      console.log('Emit', command, data ? 'with' : '', data || '');
    }
  }

  handleError(e) {
    console.error('SERVER ERROR:', e.message || e);
  }

  log(msg) {
    console.log(msg);
  }
}

module.exports = Application;
