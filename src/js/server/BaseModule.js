class BaseModule{
  name = '';
  interval = 0;
  config = {};

  lastLoop = 0;
  timer = null;

  loop(){

  }

  init(){
    this.timer && clearInterval(this.timer);

    if (this.interval) {
       this.timer = setInterval(()=>{
         try {
           const now = Date.now();

           this.loop(now, this.lastLoop);
           this.lastLoop = now;
         } catch (e) {
           console.error('Error at', this.name, e);
         }
       }, this.interval)
    }
  }
}

module.exports = BaseModule;
