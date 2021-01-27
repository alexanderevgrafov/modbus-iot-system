//const _ = require('lodash');
const path = require('path');
const ModServer = require('./ModServer')

//const Gpio = require('onoff').Gpio; //require onoff to control GPIO
//const MBusDirectionPin = new Gpio(4, 'out'); //declare GPIO4 an output
const fastify = require('fastify')({
  //  logger: true
})

const LOOP_PERIOD = 3500;
const SERVER_PORT = 8888;
//const SERIAL_PORT = '/dev/serial0';
const SERIAL_PORT = 'COM12';
//const SERIAL_PORT = '/dev/ttyUSB0';
//const serialPort = new SerialPort(SERIAL_PORT, {baudRate: 9600});
const modServer = new ModServer();

/*
async function loop() {
  const time = new Date();
  // await serialPort.writeSync(time);
  console.log("--: ", time);
  await master.setID(14);
  await master.readInputRegisters(0, 16)
    .then(res => console.log("BusRet:", res.data.join(',')))
    .catch(console.error);

}

function sleep(millis) {
  return new Promise(res => setTimeout(res, millis));
}
*/

function webserverSetup() {
  fastify
    .register(require('fastify-static'), {
      root: path.join(__dirname, '/../../../public'),
    })
    .register(require('./api-server'), {modServer})

  console.log('Server listens on port', SERVER_PORT);
  fastify.listen(SERVER_PORT, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
  })
}

modServer.init()
  .then(() => webserverSetup())
  .catch(e=>console.error(e));
//setup();
//setInterval(loop, LOOP_PERIOD);

