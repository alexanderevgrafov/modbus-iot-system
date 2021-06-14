const {getHomeServer, catchIntoStatus} = require('./common');
const Application = require('../js/server/Application');

module.exports = function (RED) {
  function asyncInitServer(node){
    const flowContext = node.context().flow;
    const app = new Application();
    const saveState = text => {
      //   console.log('SAVE STATE with!!!!!', text)
      flowContext.set('sHomeServerState', text, 'storeInFile');
    }
    const loadState = () => {
      const val = flowContext.get('sHomeServerState', 'storeInFile');

 //     console.log('LOAD STATE with!!!!!', val)

      return val;
    }

    app.initRed({saveState, loadState});

    node.status({fill: 'green', shape: 'dot', text: 'Created '});

    flowContext.set('sHomeServer', app);

    node.on('close', (removed, done) => {
      //       console.log('Central node is CLOSING')
      app.destroy();
      flowContext.set('sHomeServer', null);
//        console.log('Central node is CLOSING DONE')
      done();
    });
  }
  function SHomeCentralServerNode(config) {
    RED.nodes.createNode(this, config);

    //  const node = this;
    const flowContext = this.context().flow;
    const {sHomeServer} = flowContext;

    this.status({fill: 'blue', shape: 'ring', text: 'Waiting to be initialised'});

    if (sHomeServer) {
      this.status({fill: 'red', shape: 'ring', text: 'Already exists ' + sHomeServer});
    } else {
      setTimeout(()=>asyncInitServer(this, config), 2500);
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
        const propName = config.prop || 'payload';

        this.status({fill: 'green', shape: 'dot', text: 'Ready'});

        const board = app.boardsManager.getBoard(bid);

        node.on('input', msg => {
          if (!msg || !msg[propName]) {
            return;
          }
          const {pin, value} = msg[propName];
          board.setDataPin(pin, value);
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
