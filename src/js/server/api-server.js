const BITS_ADDR = 16;
const SLAVE_ID_ADDR = 1;

async function routes(fastify, options) {

  const {master} = options;

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
      .then(() => master.setID(parseInt(slaveId)))
      .then(cb)
      .finally(() => modbusCalls--)
  }

  // fastify.get('/led', async request => {
  //     const bits = parseInt(request.query.led);

  //     await master.setID(14);
  //     await master.writeRegister(8, bits)
  //   //  .then(res => console.log("write res:", res))
  //     .catch(console.error);

  //     return {result: bits}
  //   })


  fastify.get('/config/:id', async request => {
    try {
      const data = await modbusQuene(parseInt(request.params.id),
        () => master.readInputRegisters(0, 11))  //we load from zero to include dataOffset
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

      return {ok: true, data};

    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  })

  fastify.get('/data/:id/:addr', async request => {
    const {id, addr} = request.params;
    try {
      const pins = await modbusQuene(parseInt(id), () => master.readHoldingRegisters(parseInt(addr), 1))
        .then(x => x.data[0]);
      return {ok: true, data: {pins}};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  })

  fastify.post('/config/:id', async request => {
    const {read, write, addr, bid, startingPin} = JSON.parse(request.body);
    const _addr = parseInt(addr);
    const words = [bid, startingPin, parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    try {
      await modbusQuene(parseInt(request.params.id), () => master.writeRegisters(1, words)); 
      return {ok: true};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  })

  fastify.post('/data/:id', async request => {
    const {pins, addr} = JSON.parse(request.body);
    const arr = [parseInt(pins), parseInt(addr)];

    try {
      await modbusQuene(parseInt(request.params.id), () => master.writeRegisters(addr, arr))
      return {ok: true};
    } catch (err) {
      return {ok: false, message: err.message || err};
    }
  })

  fastify.post('/setid/:id', async request => {
    const {newid} = JSON.parse(request.body);
    const arr = [parseInt(newid)];
    const {id} = request.params;

    try {
      await modbusQuene(parseInt(id), () => master.writeRegisters(SLAVE_ID_ADDR, arr))
      return {ok: true, id: newid};
    } catch (err) {
      return {ok: false, id, message: err.message || err};
    }
  })

  /*
      fastify.get('/animals', async request => {
        const result = await collection.find().toArray()
        if (result.length === 0) {
          throw new Error('No documents found')
        }
        return result
      })

      fastify.get('/animals/:animal', async request => {
        const result = await collection.findOne({ animal: request.params.animal })
        if (result === null) {
          throw new Error('Invalid value')
        }
        return result
      })
      */
}

module.exports = routes
