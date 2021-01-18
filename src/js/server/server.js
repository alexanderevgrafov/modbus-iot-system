const path = require('path');
const ModbusRTU = require("modbus-serial");
const SerialPort = require("serialport");
//const Gpio = require('onoff').Gpio; //require onoff to control GPIO
//const MBusDirectionPin = new Gpio(4, 'out'); //declare GPIO4 an output
const fastify = require('fastify')({
  //  logger: true
})

const LOOP_PERIOD = 3500;
const SERVER_PORT = 3003;
//const SERIAL_PORT = '/dev/serial0';
const SERIAL_PORT = 'COM12';
//const SERIAL_PORT = '/dev/ttyUSB0';
//const serialPort = new SerialPort(SERIAL_PORT, {baudRate: 9600});
const master = new ModbusRTU();


SerialPort.list().then(function (ports) {
  ports.forEach(function (port) {
    console.log(`Port: ${port.path} (${port.manufacturer})`);
  })
});

function setup() {
  //    master.open();
  //  serialPort.open();
  console.log('---------------SerialPort:', SERIAL_PORT);
  //  MBusDirectionPin.writeSync(1);
  master.connectRTUBuffered(SERIAL_PORT, { baudRate: 9600 }, () => {

    webserverSetup();

    master.setID(14);
    master.setTimeout(4000);

  });

}

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
/*
function write() {
    // write the values 0, 0xffff to registers starting at address 5
    // on device number 1.
    client.writeRegisters(5, [0 , 0xffff])
        .then(read);
}
 
function read() {
    // read the 2 registers starting at address 5
    // on device number 1.
    
}
*/

function webserverSetup() {
  fastify
    .register(require('fastify-static'), {
      root: path.join(__dirname, '/../../../public'),
    })
    .register(require('./api-server'), { master })

  console.log('Server listens on port', SERVER_PORT);
  fastify.listen(SERVER_PORT, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
  })
}

setup();
//setInterval(loop, LOOP_PERIOD);

