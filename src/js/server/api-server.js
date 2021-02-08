const _ = require('lodash');
const config = require('./config');

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
      .catch(e=>{      
//        console.log("QERR:", e); 
        throw new Error(e.message || e)      
      })
      .finally(() => modbusCalls--)
  }

  const fastifyHandlers = [
    ['get', '/config/:id', getBoardConfig],
    ['get', '/data/:id/:addr', getBoardData],
    ['post', '/config/:id', setBoardConfig],
    ['post', '/data/:id', setBoardData],
    ['post', '/setid/:id', setBoardId],
    ['get', '/state', getSystemState],
    ['post', '/state', setSystemState],
    ['post', '/setport', setMasterPort]
  ];

  _.each(fastifyHandlers, ([method, url, func]) => fastify[method](url, async (request, response) => {
    try {
      const params = {request, response, params: request.params};

   //   console.warn(url, method, request.body);

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
      console.error('API error catch:', err);
      return {ok: false, message: err.message || err, error: err};
    }
  }));

  //_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-

  async function getBoardConfig({params: {id}}) {
    return await modbusQuene(id, () => modServer.master.readInputRegisters(0, 11))  //we load from zero to include dataOffset word
      .then(res => {
        const {data} = res;

        return {
          read: data[3],
          write: data[4],
          addr: (data[8] << 16) | (data[7]),
          dataOffset: data[0],
          startingPin: data[2],
        }
      })
  }

  async function getBoardData({params: {id, addr}}) {
    const [pins, readPins] = await modbusQuene(parseInt(id), () => modServer.master.readHoldingRegisters(parseInt(addr), 2))
      .then(x => x.data);
  //    console.log("Pins", pins, "readPins", readPins);

    return {pins, readPins};
  }

  async function setBoardConfig({params: {id}, body: {read, write, addr, bid, startingPin}}) {
    const _addr = parseInt(addr);
    const words = [bid, startingPin, parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(1, words));
  }

  async function setBoardData({params: {id}, body: {pins, addr}}) {
    const arr = [parseInt(pins)];
    console.log("Set data", arr);
    await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(addr, arr))
  }

  async function setBoardId({params: {id}, body: {newid}}) {
    const arr = [parseInt(newid)];

    await modbusQuene(parseInt(id), () => modServer.master.writeRegisters(config.SLAVE_ID_ADDR, arr))

    return {id: newid};
  }

  async function getSystemState() {
    return await modServer.getSystemState();
  }

  async function setSystemState({body}) {
    await modServer.setSystemState(body);
  }

  async function setMasterPort({body: {port}}) {
    try {
      await modServer.setComPort(port);
      modServer.master.setTimeout(2500);

    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = routes
