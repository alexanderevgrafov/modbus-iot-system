class BaseModule{
  name = '';
  interval = 0;
  config = {};

  modServer;
  lastLoop = 0;
  timer = null;

  loop(){

  }

  init(server){
    const callLoop = ()=>{
      const now = Date.now();

      try {
        this.loop(now, this.lastLoop);
        this.lastLoop = now;
        } catch (e) {
        console.error('Error at', this.name, e);
      }
    }
    this.modServer = server;
    this.timer && clearInterval(this.timer);

    console.log('Init module', this.name);
    
    if (this.interval) {
       setTimeout(callLoop, 2000);
       this.timer = setInterval(callLoop, this.interval);
    }
  }
}

module.exports = BaseModule;
