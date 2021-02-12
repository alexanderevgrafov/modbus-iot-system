const BaseModule = require("../BaseModule")
const dayjs = require("dayjs")

class PumpModule extends BaseModule {
  interval = 60000;
  name = 'Pump';
  config = {
    relayPin: 0,   // TODO: учитывать starting pin
    boardId: 16,  //  каждый плагин должен отвечать либо всем платам либо конкретной
  }

  loop(now, lastLoop) {
    const minutes = Math.floor(now / 60000);
   // const seconds = Math.floor(now / 1000);

    const current = !!this.modServer.getDataPin(this.config.relayPin);
    const cycle = minutes % 60;
    const assumed = cycle < 12;

    //console.log('Pump module', cycle, current, assumed);
    
    if (current !== assumed) {
      this.modServer.setDataPin(this.config.relayPin, assumed);

      console.log('Pump', assumed ? 'ON':'OFF', dayjs().format('HH:mm'));

      this.modServer.setBoardData({
        id: this.config.boardId, 
        pins: this.modServer.brd_data,
        addr: this.modServer.brd_addr}) 
    }

  }
}


module.exports=new PumpModule();
