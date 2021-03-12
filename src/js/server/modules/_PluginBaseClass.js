const _ = require('lodash');

class _PluginBaseClass {
  name = '';
  config = {};
  lastLoop = 0;
  timer = null;
  handlers = [];

  loop(){

  }

  onEvent(board, changes, path){
//    console.log('!!!!Change Event:', board.bid, path, changes);
  }

  init({name, config}, app){
    const callLoop = ()=>{
      const now = Date.now();

      try {
        this.loop(now, this.lastLoop);
        this.lastLoop = now;
        } catch (e) {
        console.error('Error at', this.title, e);
      }
    }

    this.clear();

    this.application = app;
    this.config = config;
    this.name = name;

    console.log('Plugin', this.title, 'is initialised with', this.config);

    const interval = _.get(this, 'config.interval', 0);
    const events = _.get(this, 'config.events', []);

    if (interval) {
       setTimeout(callLoop, 2000);
       this.timer = setInterval(callLoop, interval);
    }

    _.each(events, ({bid, paths})=>{
      if (bid && _.isArray(paths) && paths.length) {
        _.each(paths, path=> {
          const eventHandler = app.boardsManager.setBoardEvent(bid, path, (board, changes)=>this.onEvent(board, changes, path, 'boardChange'));
          this.handlers.push(eventHandler);
        });
      }
    })
  }

  stop(){
    this.clear();
    console.log('Plugin', this.title, 'is stopped');
  }

  clear(){
    this.timer && clearInterval(this.timer);
    this.clearHandlers();
  }

  clearHandlers(){
    _.each(this.handlers, handler=>{
      this.application.boardsManager.removeBoardEvent(handler)
    })
  }

  getLayout(){

  }

  onLayoutChange(){

  }

  emitChange(name, state) {
    this.application.pluginsManager.emitLayoutChange(this.name, name, state)
  }
}

module.exports = _PluginBaseClass;
