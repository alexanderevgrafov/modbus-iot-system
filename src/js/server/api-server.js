async function routes (fastify, options) {

    const {master} = options;

    fastify.get('/test', async (request, reply) => {
      return { hellow: 'world' }
    })

    fastify.get('/led', async (request, reply) => {
        const bits = parseInt(request.query.led);
  
        await master.setID(14);
        await master.writeRegister(8, bits)
      //  .then(res => console.log("write res:", res))
        .catch(console.error);

        return {result: bits}
      })
    
/*  
    fastify.get('/animals', async (request, reply) => {
      const result = await collection.find().toArray()
      if (result.length === 0) {
        throw new Error('No documents found')
      }
      return result
    })
  
    fastify.get('/animals/:animal', async (request, reply) => {
      const result = await collection.findOne({ animal: request.params.animal })
      if (result === null) {
        throw new Error('Invalid value')
      }
      return result
    })
    */
  }
  
  module.exports = routes