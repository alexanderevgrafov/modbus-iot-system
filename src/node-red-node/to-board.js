const {getHomeServer, catchIntoStatus} = require('./common');

module.exports = function (RED) {
  function SHomeToBoard(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    const flowContext = node.context().flow;

    node.status({fill: 'blue', shape: 'ring', text: 'Waiting for main component'});

    getHomeServer(flowContext)
      .then(app => {
        const bid = parseInt(config.bid);

        this.status({fill: 'green', shape: 'dot', text: 'Ready'});

        const board = app.boardsManager.getBoard(bid);

        node.on('input', msg => {
          board.setDataPin(msg.pin, !!msg.value);
        });
      })
      .catch(catchIntoStatus(node))

    this.on('close', (removed, done) => done());
  }

  RED.nodes.registerType('s-home-to-board', SHomeToBoard);
}
