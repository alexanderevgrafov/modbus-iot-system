async function routes (fastify, options) {


    fastify.get('/test', async (request, reply) => {
      return { hellow: 'world' }
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
  
  //module.exports.pre
  module.exports = routes