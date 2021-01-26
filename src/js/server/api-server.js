const _ = require('lodash');
const fs = require('fs');

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

  _.each(fastifyHandlers, ([method, url, func]) => fastify[method](url, async (request, response) => {
    try {
      const params = {request, response, params: request.params};

      if (method === 'post') {
        params.body = JSON.parse(request.body);
      }
      const result = await func(params);
      const data = {ok: true};

      if (result) {
        data.data = result;
      }

      return data
    } catch (err) {
      return {ok: false, message: err.message || err, error: err};
    }
  }));

  //_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-

  async function getBoardConfig({params: {id}}) {
    const data = await modbusQuene(id, () => modServer.master.readInputRegisters(0, 11))  //we load from zero to include dataOffset
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

    return data;
  }

  async function getBoardData({params: {id, addr}}) {
    const pins = await modbusQuene(parseInt(id), () => modServer.master.readHoldingRegisters(parseInt(addr), 1))
      .then(x => x.data[0]);

    return {pins};
  }

  async function setBoardConfig({params: {id}, body: {read, write, addr, bid, startingPin}}) {
    const _addr = parseInt(addr);
    const words = [bid, startingPin, parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(1, words));
  }

  async function setBoardData({params: {id}, body: {pins, addr}}) {
    const arr = [parseInt(pins), parseInt(addr)];

    await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(addr, arr))
  }

  async function setBoardId({params: {id}, body: {newid}}) {
    const arr = [parseInt(newid)];

    await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(SLAVE_ID_ADDR, arr))

    return {id: newid};
  }

  async function getSystemState() {
    const data = JSON.parse(fs.readFileSync(CONFIG_STORAGE_FILE));
    data.ports = modServer.getPortsList();

    console.log('state to LOAD: ', data);

    return {data};
  }

  async function setSystemState({body}) {
    console.log('state to SAVE: ', body);

    fs.writeFileSync(CONFIG_STORAGE_FILE, JSON.stringify(body))
  }

  async function setMasterPort({body: {port}}) {
    modServer.setComPort(port);
  }
}

module.exports = routes
