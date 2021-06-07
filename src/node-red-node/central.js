const Application = require('../js/server/Application');

module.exports = function (RED) {
  function SHomeServerNode(config) {
    RED.nodes.createNode(this, config);

    //  const node = this;
    const flowContext = this.context().flow;
    const {sHomeServer} = flowContext;
    const saveState = text => {
   //   console.log('SAVE STATE with!!!!!', text)
      flowContext.set('sHomeServerState', text, 'storeInFile');
    }
    const loadState = () => {
      const val = flowContext.get('sHomeServerState');

  //    console.log('LOAD STATE with!!!!!', val)

      return val;
    }

    if (sHomeServer) {
      this.status({fill: 'red', shape: 'ring', text: 'Already exists ' + sHomeServer});
    } else {
      const app = new Application();

      app.initRed({saveState, loadState});

      this.status({fill: 'green', shape: 'dot', text: 'Created '});

      flowContext.set('sHomeServer', app);

      //  node.on('input', node.send);

      this.on('close', (removed, done) => {
        app.destroy();
        delete flowContext.sHomeServer;
        done();
      });
    }
  }

  RED.nodes.registerType('s-home-central', SHomeServerNode);
}
