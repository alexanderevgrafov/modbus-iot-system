module.exports = function (RED) {
  function SHomeServerNode(config) {
    RED.nodes.createNode(this, config);


    const node = this;
    const flowContext = this.context().flow;
    const {sHomeServer} = flowContext;

    if (sHomeServer) {
      this.status({fill: 'red', shape: 'ring', text: 'Already exists ' + sHomeServer});
    } else {
      this.status({fill: 'green', shape: 'dot', text: 'Created '});

      flowContext.sHomeServer = new Date();

      node.on('input', function (msg) {
        //  const txt = msg.payload = msg.payload.toLowerCase();
        node.send(msg);
      });

      this.on('close', function (removed, done) {
        delete flowContext.sHomeServer;
        done();
      });
    }
  }

  RED.nodes.registerType('s-home-central', SHomeServerNode);
}
