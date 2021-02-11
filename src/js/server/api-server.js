const _ = require('lodash');

//const config = require('./config');

async function routes(fastify, options) {
  const {modServer} = options;
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
    // return await modbusQuene(id, () => modServer.master.readInputRegisters(0, 11))  //we load from zero to include dataOffset word
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

    return await modServer.getBoardConfig(id);
  }

  async function getBoardData({params: {id, addr}}) {
    // const [pins, readPins] = await modbusQuene(parseInt(id), () => modServer.master.readHoldingRegisters(parseInt(addr), 2))
    //   .then(x => x.data);
    //   console.log("Pins", pins, "readPins", readPins);
    //
    // return {pins, readPins};
    return await modServer.getBoardData(id, addr);

  }

  async function setBoardConfig({params: {id}, body: {read, write, addr, bid, startingPin}}) {
    return await modServer.setBoardConfig({id, read, write, addr, bid, startingPin});//modbusQuene(parseInt(id), () => modServer.master
  }

  async function setBoardData({params: {id}, body: {pins, addr}}) {
    return await modServer.setBoardData({id, pins, addr})
  }

  async function setBoardId({params: {id}, body: {newid}}) {
    return await modServer.setBoardId(id, newid);
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
