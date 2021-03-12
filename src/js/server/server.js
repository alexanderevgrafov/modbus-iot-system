const Application = require('./Application');
const app = new Application();

[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, cleanUpServer.bind(null, eventType));
})

app.init()
  .catch(e => console.error(e));

function cleanUpServer(eventType){
  app.saveSystemState();
  console.log('Exit after', eventType);

  return process.exit();
}
