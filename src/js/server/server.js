const _ = require('lodash');
const path = require('path');
const ModServer = require('./ModServer');
const config = require('./config');
const fastify = require('fastify')({
  //  logger: true
})

const modServer = new ModServer();
const modules = [
  require('./modules/pump'),
];

function webserverSetup() {
  fastify
    .register(require('fastify-static'), {
      root: path.join(__dirname, config.PUBLIC_PATH),
    })
    .register(require('./api-server'), {modServer})

  console.log(`Listens on ${config.LISTEN_HOST}:${config.SERVER_PORT}`);
  
  fastify.listen(config.SERVER_PORT, config.LISTEN_HOST, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
  })
}

function initModules(modules) {
  _.each(modules, module=>module.init(modServer))
}

modServer.init()
  .then(() => webserverSetup())
  .then(() => initModules(modules))
  .catch(e=>console.error(e));


