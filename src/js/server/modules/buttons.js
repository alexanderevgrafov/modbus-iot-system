const _ = require('lodash');
const PluginBase = require('./_PluginBaseClass')

const NAME = 'Buttons';

const toggleBit = (value, bit, force) => force ? (value | (1 << bit)) : (value & (0xFFFF ^ (1 << bit)));

class ButtonsModule extends PluginBase {
  title = NAME;

  // buttons = null;

  init(plug, app) {
    super.init(plug, app);

    this.buttons = _.fromPairs(
      _.map(this.config.buttons, (conf, indx) => {
        const {type, label, bid, pin} = conf;
        const board = this.application.boardsManager.getBoard(bid);

        return [
          'butt' + indx,
          {
            type: type || 'button',
            label,
            bid, pin,
            state: {
              value: board && board.data.isOn(pin),
            }
          }]
      })
    );
  }

  stop() {
    super.stop();
  }

  getLayout() {
    return _.mapValues(this.buttons, ({type, label, state}) => ({type, label, state}));
  }

  onEvent(board, changes, path, eventName) {
    super.onEvent(board, changes, path);

    _.each(this.buttons, (butt, controlName) => {
      if (butt.bid === board.bid) {
        const changed = _.get(changes, 'data.pins');

        if (!_.isUndefined(changed)) { //make sure board change is about data pins
          const newVal = !!(changed & (1 << butt.pin));

          //   console.log('DBG:', changed, (1 << butt.pin), newVal, butt.state.value);

          if (butt.state.value !== newVal) {
            butt.state.value = newVal;
            this.emitChange(controlName, {value: newVal});
          }
        }
      }
    })
  }

  onLayoutChange(controlName, change) {
    console.log('BUTTONS PLUG caught LayoutChange:', controlName, change);

    const butt = this.buttons[controlName];

    if (butt) {
      const {bid, pin} = butt;
      const board = this.application.boardsManager.getBoard(bid);

      if (board) {
        board.setDataPin(pin, change.value);
      }

      // board && board.data.togglePin(pin, change.value);
    }
  }
}

const defaultConfig = {
  buttons: []
};

module.exports = {
  Class: ButtonsModule,
  title: NAME,
  defaultConfig
}
