const BaseModule = require("../BaseModule")

class PumpModule extends BaseModule {
  interval = 6000;

  loop(now, lastLoop) {
    console.log('Pump module', now, lastLoop);
  }
}


module.exports=new PumpModule();
