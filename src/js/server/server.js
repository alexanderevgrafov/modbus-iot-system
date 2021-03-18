const Application = require('./Application');
const app = new Application();

[`SIGINT`, `SIGUSR1`, `SIGUSR2`, 'unhandledRejection', 'uncaughtException', `SIGTERM`].forEach((eventType) => {
  process.on(eventType, cleanUpServer.bind(null, eventType));
})

app.init()
  .catch(e => console.error(e));

function cleanUpServer(eventType, reason, promise){
  app.saveSystemState();
  console.log('Exit after', eventType, 'Reason:', reason, 'Data:', promise);

  return process.exit();
}
