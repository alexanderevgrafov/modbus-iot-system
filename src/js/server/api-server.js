const _ = require('lodash');
const config = require('./config');
const Json5 = require('json5');

async function routes(fastify, options) {
  const {app} = options;
  const fastifyHandlers = [
    ['get', '/config/:id', getBoardConfig],
    ['get', '/data/:id/:addr', getBoardData],
    ['post', '/board/:id', setBoard],
    ['post', '/board/newid', setBoardId],
    ['post', '/add-board', addBoard],
    ['delete', '/board/:id', removeBoard],

    ['get', '/state', getSystemState],
    ['post', '/state', setSystemState],

    ['post', '/setport', setMasterPort],

    ['get', '/plugin/list', getPluginsList],
    ['post', '/plugin/list', setPluginsList],
    ['get', '/plugin/:name/config', getPluginConf],
    ['post', '/plugin/:name/config', setPluginConf],

    ['post', '/layout/change', sendLayoutChange],
  ];

  _.each(fastifyHandlers, ([method, url, func, schema]) => {
    const options = {};
    if (schema) {
      options.schema = schema;
    }

    fastify[method](url, options, async (request, response) => {

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
    })
  });

  //_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-

  async function getBoardConfig({params: {id}}) {
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

  async function setBoardId({body: {bid, newbid}}) {
    return await app.boardsManager.setBoardId(bid, newbid);
  }

  async function setBoard({params: {id}, body: json}) {
    const board = app.boardsManager.getBoard(id);

    return await board.set(json, 'api');
  }

  async function addBoard({body: json}) {
    return await app.boardsManager.addBoard(json);
  }

  async function removeBoard({params: {id}}) {
    return await app.boardsManager.removeBoard(id);
  }

  async function getSystemState() {
    return app.getFullStateJson();
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

  async function getPluginsList() {
    return await app.pluginsManager.getPluginsList();
  }

  async function setPluginsList({body:{list}}) {
    return await app.pluginsManager.setPluginsList(list);
  }

  async function getPluginConf({params: {name}}) {
    return await app.pluginsManager.getPluginConfig(name);
  }

  async function setPluginConf({params: {name}, body: {config/*, isActive*/}}) {
    // if (!_.isUndefined(isActive)) {
    //   await app.pluginsManager.togglePlugin(name, !!isActive);
    // }

    if (!_.isUndefined(config)) {
      await app.pluginsManager.setPluginConfig(name, Json5.parse(config));
    }
  }

  async function sendLayoutChange({body}) {
    await app.pluginsManager.setLayoutChange(body)
  }
}

module.exports = routes
