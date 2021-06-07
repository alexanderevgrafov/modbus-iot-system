const { getHomeServer, catchIntoStatus } = require('./common');

module.exports = function (RED) {
  function SHomeBoardInput(config) {
    const node = this;

    RED.nodes.createNode(node, config);

    node.status({fill: 'blue', shape: 'ring', text: 'Waiting for main component'});

    getHomeServer( node.context().flow )
      .then(app => {
        this.status({fill: 'green', shape: 'dot', text: 'Ready'});

        const board = app.boardsManager.getBoard(config.bid);

        console.log('BoardInput', config, board);

        node.on('input', msg => {
          board.setDataPin(config.pin, !!msg.payload);

          node.send(msg);
        });
      })
      .catch(catchIntoStatus(node))

    this.on('close', (removed, done) => done());
  }

  RED.nodes.registerType('s-home-board', SHomeBoardInput);
}
