const PluginBase = require('./_PluginBaseClass')
const dayjs = require('dayjs')

const NAME = 'Pump';

class PumpModule extends PluginBase {
  title = NAME;

  loop(now, lastLoop) {
    const {boardId: bid, startAt, stopAt, cycleLength, relayPin} = this.config;
    // const minutes = Math.floor(now / 60000);
    // const hours = dayjs().get('hour');
    // const minutes = dayjs().get('minute');
    // const seconds = dayjs().get('second');

    const seconds = dayjs().get('second') + (dayjs().get('minute') + dayjs().get('hour')*60)*60;
    const board = this.application.boardsManager.getBoard(bid);

    const current = !!board.data.isOn(relayPin);
    const cycle = seconds % (cycleLength || 60);
    const assumed = cycle > startAt && cycle < stopAt;

    console.log('Pump module', cycle, current, assumed);

    if (current !== assumed) {
      this.status = assumed;
      board.setDataPin(relayPin, assumed);

 //     console.log('Pump', assumed ? 'ON' : 'OFF', dayjs().format('HH:mm'));

      this.emitChange('pump', {status: this.getStatusText()});

      // this.modServer.setBoardData({
      //   id: this.config.boardId,
      //   pins: this.modServer.brd_data,
      //   addr: this.modServer.brd_addr})
    }

  }

  getLayout() {
    return {
      pump:{
        type:'information',
        label:'Pump status',
        state:{
          status: this.getStatusText(),
        }
      }
    }
  }

  getStatusText(){
    return this.status ? 'ON' : 'OFF';
  }
}

const defaultConfig = {
  startAt: 0,
  stopAt: 0,
  cycleLength:60,
  relayPin: 0,
  boardId: 0,
};

module.exports = {
  Class: PumpModule,
  title: NAME,
  defaultConfig
}
