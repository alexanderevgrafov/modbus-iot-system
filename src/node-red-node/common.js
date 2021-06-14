function getHomeServer(flowContext, attempt = 0) {
  return new Promise((resolve, reject) => {
    if (!flowContext) {
      reject('No flow context found');
    }
    const app = flowContext.get('sHomeServer');

    if (!app || !app.isInitialised) {
      if (attempt > 2) {
        reject('SHome server node is not found on the schema');
      }

     // console.log('getHS set timer');

      setTimeout(() => {
        getHomeServer(flowContext, attempt++)
          .then(ppp=>{
            resolve(ppp);

           // console.log('getHS resolve after a while', ppp);
          })
          .catch(reject)
      }, 500);
    } else {

     // console.log('getHS resolving fast with ', app);
      resolve(app);
    }
  })
}

function catchIntoStatus(node) {
  return e => node.status({fill: 'red', shape: 'ring', text: e.message || e})
}

module.exports = {
  getHomeServer,
  catchIntoStatus,
}
