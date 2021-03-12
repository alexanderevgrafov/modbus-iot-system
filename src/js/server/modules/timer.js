const _ = require('lodash');
const cron = require('node-cron');
const PluginBase = require('./_PluginBaseClass')

class TimerModule extends PluginBase {
  tasks = [];
  state = {};

  init(plug, app) {
    super.init(plug, app);

    _.each(this.config.timers, timer => {
      const {bid, pin, steps} = timer;
      this.state[bid + '#' + pin] = false;

      _.each(steps, step => {
        const {on, expression} = step;
        const cb = () => this.setPin(bid, pin, on);
        const task = cron.schedule(expression, cb,  {
          scheduled: true
        });

        this.tasks.push(task);
      });
    });
  }

  clear() {
    super.clear();

   _.each(this.tasks, task =>{ task.stop() });

    this.tasks = [];
    this.state = {};
  }

  getLayout() {
    return {
      timer: {
        type: 'information',
        label: 'Timer status',
        state: {
          status: this.getStatusText(),
        }
      }
    }
  }

  getStatusText() {
    return _.map(this.state, (val, pin) => `[${pin}:${val ? 'ON' : 'OFF'}]`).join('');
  }

  setPin(bid, pin, on) {
    const board = this.application.boardsManager.getBoard(bid);

    console.log('Timer', bid, pin, on)
    if (board) {
      board.setDataPin(pin, on);

      this.state[bid + '#' + pin] = on;

      this.emitChange('timer', {status: this.getStatusText()});
    }
  }
}

const defaultConfig = {
  timers: [
    {
      bid: 1, pin: 1,
      steps: [
        {on: true, expression: '10 * * * * *'},
        {on: false, expression: '30 * * * * *'},
        {on: true, expression: '45 * * * * *'},
        {on: false, expression: '0 * * * * *'},
      ]
    }
  ]
};

module.exports = {
  Class: TimerModule,
  title: 'Timer',
  defaultConfig
}
