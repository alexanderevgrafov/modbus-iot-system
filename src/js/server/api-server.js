const _ = require('lodash');
const fs = require('fs');

const BITS_ADDR = 16;
const SLAVE_ID_ADDR = 1;
const CONFIG_STORAGE_FILE = 'configStorage.json'

async function routes(fastify, options) {
  const {modServer} = options;
  let modbusCalls = 0;

  function waitModbusIdle() {
    if (!modbusCalls) {
      return Promise.resolve();
    } else {
      return new Promise(res =>
        setTimeout(async () => {
          await waitModbusIdle();
          res();
        }, 200)
      );
    }
  }

  function modbusQuene(slaveId, cb) {
    return waitModbusIdle()
      .then(() => modbusCalls++)
      .then(() => modServer.master.setID(parseInt(slaveId)))
      .then(cb)
      .finally(() => modbusCalls--)
  }

  const fastifyHandlers = [
    'get', '/config/:id', getBoardConfig,
    'get', '/data/:id/:addr', getBoardData,
    'post', '/config/:id', setBoardConfig,
    'post', '/data/:id', setBoardData,
    'post', '/setid/:id', setBoardId,
    'get', '/state', getSystemState,
    'post', '/state', setSystemState,
    'post', '/setport', setMasterPort
  ];

  _.each(fastifyHandlers, ([method, url, func]) => fastify[method](url, func));

  async function getBoardConfig(request) {
    try {
      const data = await modbusQuene(parseInt(request.params.id),
        () => modServer.master.readInputRegisters(0, 11))  //we load from zero to include dataOffset
        .then(res => {
          console.log('PR1:', res);
          const {data} = res;
          return {
            read: data[3],
            write: data[4],
            addr: (data[8] << 16) | (data[7]),
            dataOffset: data[0],
            startingPin: data[2],
          }
        })

      console.log('PR2:', data);

      return {ok: true, data};

    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }

  async function getBoardData(request) {
    const {id, addr} = request.params;
    try {
      const pins = await modbusQuene(parseInt(id), () => modServer.master.readHoldingRegisters(parseInt(addr), 1))
        .then(x => x.data[0]);
      return {ok: true, data: {pins}};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }

  async function setBoardConfig(request) {
    const {read, write, addr, bid, startingPin} = JSON.parse(request.body);
    const _addr = parseInt(addr);
    const words = [bid, startingPin, parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    try {
      await modbusQuene(parseInt(request.params.id), () => modServer.master.writeRegisters(1, words));
      return {ok: true};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }

  async function setBoardData(request) {
    const {pins, addr} = JSON.parse(request.body);
    const arr = [parseInt(pins), parseInt(addr)];

    try {
      await modbusQuene(parseInt(request.params.id), () => modServer.master.writeRegisters(addr, arr))
      return {ok: true};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }

  async function setBoardId(request) {
    const {newid} = JSON.parse(request.body);
    const arr = [parseInt(newid)];
    const {id} = request.params;

    try {
      await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(SLAVE_ID_ADDR, arr))
      return {ok: true, id: newid};
    } catch (err) {
      return {ok: false, id, message: err.message || err};
    }
  }

  async function getSystemState(request) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_STORAGE_FILE));
      data.ports = modServer.getAllPorts();

      console.log('state is to LOAD: ', data);
      return {ok: true, data: data};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }

  async function setSystemState(request) {
    const {data} = JSON.parse(request.body);
    console.log('state is to save: ', data);

    try {
      fs.writeFileSync(CONFIG_STORAGE_FILE, JSON.stringify(data))
      return {ok: true};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }

  async function setMasterPort(request) {
    const {port} = JSON.parse(request.body);

    try {
      modServer.setPort(port);
      return {ok: true};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  }
}

module.exports = routes
