const _ = require('lodash');
const {getHomeServer, catchIntoStatus} = require('./common');

module.exports = function (RED) {
  function SHomeFromBoardEvent(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    const flowContext = node.context().flow;
    let storedPins;

    node.status({fill: 'blue', shape: 'ring', text: 'Waiting for main component'});

    getHomeServer(flowContext)
      .then(app => {
        const bid = parseInt(config.bid);

        this.status({fill: 'green', shape: 'dot', text: 'Ready'});

        const board = app.boardsManager.getBoard(config.bid);

        app.boardsManager.setBoardEvent(bid, '', (board, changes) => {
          const newValue = _.get(changes, 'data.pins');

        //  console.log('BoardChanges', changes, newValue, storedPins);
          for (let i = 0; i < 8; i++) {
            const mask = 1 << i;
            const prevPin = storedPins & mask; // ToDo: this wont distinct previous Zero from first iteration with storedPins==undefined
            const curPin = newValue & mask;

            if (prevPin !== curPin) {
              const msg = {pin: i, val: !!curPin};

           //   console.log('board change catch', msg);

              node.send(msg);
            }
          }

          storedPins = newValue;
        });

        node.on('input', msg => {
          //  board.setDataPin(config.pin, !!msg.payload);
        //  console.log('fetch from board', bid, 'by signal', msg);
          board.fetchData();
        });
      })
      .catch(catchIntoStatus(node))

    this.on('close', (removed, done) => done());
  }

  RED.nodes.registerType('s-home-from-board-event', SHomeFromBoardEvent);
}
