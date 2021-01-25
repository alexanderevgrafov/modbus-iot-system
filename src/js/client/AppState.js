import {makeObservable, observable, action} from 'mobx'
import {BoardModel} from './BoardModel';
import {serverErrorCatch, serverErrorCatch} from './Utils'

class AppState {
  @observable boards = {};
  @observable allPorts = [];
  @observable comPort = 0;

  constructor() {
    makeObservable(this);
  }

  @action
  getBoard(bid) {
    if (!this.boards[bid]) {
      this.addBoard(bid);
    }
    return this.boards[bid];
  }

  @action
  setPort(port, allPorts = null) {
    this.comPort = port;

    if (allPorts) {
      this.allPorts = allPorts;
    }

    fetch('/setport', {method: 'post', data: JSON.stringify({port})})
      .then(x => x.json())
      .then(x => {
        serverErrorCatch(x);
      })
      .catch(serverErrorLog);
  }

  @action
  addBoard(bid) {
    return this.boards[bid] = new BoardModel(bid);
  }

  @action
  save() {
    const data = {
      boards: _.keys(this.boards).join(','),
      port: this.comPort
    }

    fetch('/state', {method: 'post', data: JSON.stringify({data})})
      .then(x => x.json())
      .then(x => {
        serverErrorCatch(x);
      })
      .catch(serverErrorLog);
  }

  @action
  load() {
    return fetch('/state')
      .then(x => x.json())
      .then(x => {
        serverErrorCatch(x);

        this.setPort(x.data.port, x.data.ports);
        _.each(x.data.boards.split(','), bid => this.addBoard(bid))

      })
      .catch(serverErrorLog);
  }
}

const appState = new AppState();

export {appState};
