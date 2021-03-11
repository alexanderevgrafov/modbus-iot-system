const PluginBase = require('./_PluginBaseClass')
const dayjs = require('dayjs')

const NAME = 'Pump';

class PumpModule extends PluginBase {
  title = NAME;

  loop(now, lastLoop) {
    const {boardId: bid, start_at, stop_at, relayPin} = this.config;
    // const minutes = Math.floor(now / 60000);
    const minutes = Math.floor(now / 1000);

    const board = this.application.boardsManager.getBoard(bid);

    const current = !!board.data.isOn(relayPin);
    const cycle = minutes % 60;
    const assumed = cycle > start_at && cycle < stop_at;

    console.log('Pump module', cycle, current, assumed);

    if (current !== assumed) {
      this.status = assumed;
      board.setDataPin(relayPin, assumed);


      console.log('Pump', assumed ? 'ON' : 'OFF', dayjs().format('HH:mm'));

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
  start_at: 0,
  stop_at: 0,
  relayPin: 0,
  boardId: 0,
};

module.exports = {
  Class: PumpModule,
  title: NAME,
  defaultConfig
}
