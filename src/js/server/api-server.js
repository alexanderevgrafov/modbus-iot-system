const BITS_ADDR = 16;

async function routes(fastify, options) {

  const { master } = options;

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
        () => master.readInputRegisters(0, 6))
        .then(res => {
          console.log('PR1:', res);
          const { data } = res;
          return {
            read: data[0],
            write: data[1],
            addr: (data[5] << 16) | (data[4])
          }
        })

      console.log('PR2:', data);

      return { ok: true, data };

    } catch (err) {
      return { ok: false, message: err.message || err };
    }
  })

  fastify.get('/data/:id', async request => {
    try {
      const pins = await modbusQuene(parseInt(request.params.id), () => master.readHoldingRegisters(BITS_ADDR, 1))
        .then(x => x.data[0]);
      return { ok: true, data: { pins } };
    } catch (err) {
      return { ok: false, message: err.message || err };
    }
  })

  fastify.post('/config/:id', async request => {
    const { read, write, addr } = JSON.parse(request.body);
    const _addr = parseInt(addr);
    const words = [parseInt(read), parseInt(write), 0, 0, _addr & 0xFFFF, _addr >> 16];

    try {
      await modbusQuene(parseInt(request.params.id), () => master.writeRegisters(0, words))
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || err };
    }
  })

  fastify.post('/data/:id', async request => {
    const { pins } = JSON.parse(request.body);
    const arr = [parseInt(pins)];

    try {
      await modbusQuene(parseInt(request.params.id), () => master.writeRegisters(BITS_ADDR, arr))
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || err };
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