const {getHomeServer, catchIntoStatus} = require('./common');
const Application = require('../js/server/Application');

module.exports = function (RED) {
  function SHomeCentralServerNode(config) {
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

  function SHomeSwitchByPin(config) {
    const node = this;

    RED.nodes.createNode(node, config);

    node.on('input', msg => {
      console.log('Switch by pin received', msg);
    });

    this.on('close', (removed, done) => done());
  }

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

  RED.nodes.registerType('central', SHomeCentralServerNode);
  RED.nodes.registerType('board event', SHomeFromBoardEvent);
  RED.nodes.registerType('switch by pin', SHomeSwitchByPin);
  RED.nodes.registerType('to board', SHomeToBoard);
}
