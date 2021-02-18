const _ = require('lodash');
const config = require('./config');

async function routes(fastify, options) {
  const {app} = options;
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

    //  console.log(method, request.params, request.body, 'to', url);
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

      //   console.log('OK',data);

      return data
    } catch (err) {
      console.error('API error catch:', err);
      return {ok: false, message: err.message || err, error: err};
    }
  }));

  //_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-

  async function getBoardConfig({params: {id}}) {
    // return await modbusQuene(id, () => app.modServer.master.readInputRegisters(0, 11))  //we load from zero to include dataOffset word
    //   .then(res => {
    //     const {data} = res;
    //
    //     return {
    //       read: data[3],
    //       write: data[4],
    //       addr: (data[8] << 16) | (data[7]),
    //       dataOffset: data[0],
    //       startingPin: data[2],
    //     }
    //   })

    return await app.modServer.getBoardConfig(id);
  }

  async function getBoardData({params: {id, addr}}) {
    // const [pins, readPins] = await modbusQuene(parseInt(id), () => app.modServer.master.readHoldingRegisters(parseInt(addr), 2))
    //   .then(x => x.data);
    //   console.log("Pins", pins, "readPins", readPins);
    //
    // return {pins, readPins};
    return await app.modServer.getBoardData(id, addr);

  }

  async function setBoardConfig({params: {id}, body: {read, write, addr, bid, startingPin}}) {
    return await app.modServer.setBoardConfig({id, read, write, addr, bid, startingPin});
    //modbusQuene(parseInt(id), () => app.modServer.master
  }

  async function setBoardData({params: {id}, body: {pins, addr}}) {
    return await app.modServer.setBoardData({id, pins, addr})
  }

  async function setBoardId({params: {id}, body: {newid}}) {
    return await app.modServer.setBoardId(id, newid);
  }

  async function getSystemState() {
    return await app.modServer.getSystemState();
  }

  async function setSystemState({body}) {
    await app.modServer.setSystemState(body);
  }

  async function setMasterPort({body: {port}}) {
    try {
      await app.modServer.setComPort(port);
      app.modServer.master.setTimeout(config.MODBUS_TIMEOUT);

    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = routes
