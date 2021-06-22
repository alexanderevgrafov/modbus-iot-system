const {getHomeServer, catchIntoStatus} = require('./common');
const Application = require('../js/server/Application');
const _ = require('lodash');

function _onServerReady(cb) {
  this.status({fill: 'blue', shape: 'ring', text: 'Waiting for main component'});

  getHomeServer(this.context().flow)
    .then(app => {
      this.status({fill: 'green', shape: 'dot', text: 'Ready'});
      cb(app);
    })
    .catch(catchIntoStatus(this))
}

module.exports = function (RED) {
  function _asyncInitServer(node) {
    const flowContext = node.context().flow;
    const app = new Application();
    const saveState = text => flowContext.set('sHomeServerState', text, 'storeInFile');
    const loadState = () => flowContext.get('sHomeServerState', 'storeInFile');

    app.initRed({saveState, loadState});

    node.status({fill: 'green', shape: 'dot', text: 'Created '});

    flowContext.set('sHomeServer', app);

    node.on('close', (removed, done) => {
      app.destroy();
      flowContext.set('sHomeServer', null);
      done();
    });
  }

  function SHomeCentralServerNode(config) {
    RED.nodes.createNode(this, config);

    const flowContext = this.context().flow;
    const {sHomeServer} = flowContext;

    this.status({fill: 'blue', shape: 'ring', text: 'Waiting to be initialised'});

    if (sHomeServer) {
      this.status({fill: 'red', shape: 'ring', text: 'Already exists ' + sHomeServer});
    } else {
      setTimeout(() => _asyncInitServer(this, config), 2500);
    }
  }

  function SHomeFromBoardEvent(config) {
    const bid = parseInt(config.bid);
    const period = parseInt(config.period);
    let fetchInterval;

    RED.nodes.createNode(this, config);

    _onServerReady.call(this, app => {
      const board = app.boardsManager.getBoard(bid);
      let {pins: storedPins} = board.fetchData();

      app.boardsManager.setBoardEvent(bid, '', (board, changes) => {
        const newValue = _.get(changes, 'data.pins');

        console.log('BoardChanges', bid, changes, newValue, storedPins);

        for (let i = 0; i < 8; i++) {
          const mask = 1 << i;
          const prevPin = storedPins & mask; // ToDo: this wont distinct previous Zero from first iteration with storedPins==undefined
          const curPin = newValue & mask;

          if (prevPin !== curPin) {
            this.send({pin: i, value: !!curPin});
          }
        }

        storedPins = newValue;
      });

      if (period) {
        setInterval(()=>board.fetchData(), period);
      }

      this.on('input', msg => board.fetchData());
    });

    this.on('close', (removed, done) => {
      clearInterval(fetchInterval);
      done();
    });
  }

  function SHomeToBoard(config) {
    RED.nodes.createNode(this, config);
    const bid = parseInt(config.bid);
    const propName = config.prop || 'payload';

    _onServerReady.call(this, app => {
      const board = app.boardsManager.getBoard(bid);

      this.on('input', msg => {
        if (!msg || !msg[propName]) {
          return;
        }
        const {pin, value} = msg[propName];
        board.setDataPin(pin, value);
      });
    })

    this.on('close', (removed, done) => done());
  }

  function SHomeInjectPin(config) {
    RED.nodes.createNode(this, config);
    const pin = parseInt(config.pin);
    const propName = config.prop || 'payload';

    this.status({fill: 'green', shape: 'dot', text: 'Pin ' + pin});

    this.on('input', msg => {
      this.send({[propName]: {pin, value: msg[propName]}});
    });
  }

  RED.nodes.registerType('central', SHomeCentralServerNode);

  RED.nodes.registerType('board event', SHomeFromBoardEvent);
  RED.nodes.registerType('to board', SHomeToBoard);

  RED.nodes.registerType('inject pin id', SHomeInjectPin);

  // function SHomeSwitchByPin(config) {
  //   RED.nodes.createNode(this, config);
  //
  //   this.on('input', msg => {
  //     const messages = new Array(this.outputCount)
  //     messages[msg.pin % 8] = {payload: msg.value};
  //
  //     this.send(messages);
  //   });
  //
  //   this.on('close', (removed, done) => done());
  // }
  // RED.nodes.registerType('switch by pin', SHomeSwitchByPin);
}
