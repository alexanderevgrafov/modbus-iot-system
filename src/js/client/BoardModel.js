import {makeObservable, observable, action} from 'mobx'
import {serverErrorCatch} from './Utils'

class PinConfigModel {
  pin = 0
  @observable read = false
  @observable write = false
  @observable addr = 0

  constructor(_parent, v) {
    v && Object.assign(this, v);
    this._parent = _parent;

    makeObservable(this);
  }

  @action
  setRead(x) {
    this.read = x;
    x && (this.write = false);
  }

  @action
  setWrite(x) {
    this.write = x;
    x && (this.read = false);
  }

  @action
  setAddr(x) {
    const {startingPin} = this._parent;
    x = parseInt(x) || 0
    x = x > 0 && Math.min(startingPin + 7, Math.max(x, startingPin));
    this.addr = x > 0 ? x - this.pin - startingPin : 0;
  }
}

class BoardConfigModel {
  @observable loaded = false;
  @observable boardId = 0;
  @observable startingPin = 0;
  @observable pins = []

  constructor(parent) {
    this._parent = parent;
    _.each(_.range(0, 8), pin =>
      this.pins[pin] = new PinConfigModel(this, {pin})
    )
    makeObservable(this);
  }

  @action
  setFromMasks({read, write, addr}) {
    _.each(_.range(0, 8), pin => {
      this.pins[pin].read = !!(read & (1 << pin));
      this.pins[pin].write = !!(write & (1 << pin));
      this.pins[pin].addr = (addr >> (pin * 4)) & 0xF;
    })
  }

  @action
  setNewId(x) {
    this.boardId = parseInt(x);
  }

  @action
  setNewStPin(x) {
    this.startingPin = parseInt(x);
  }

  @action setLoaded(x) {
    this.loaded = !!x;
  }

  update() {
    const data = {read: 0, write: 0, addr: 0, bid: this.boardId, startingPin: this.startingPin};

    _.each(_.range(0, 8), pin => {
      data.read |= this.pins[pin].read ? (1 << pin) : 0;
      data.write |= this.pins[pin].write ? (1 << pin) : 0;
      data.addr |= (this.pins[pin].addr & 0xF) << (4 * pin);
    })

    fetch('/config/' + this._parent.bid, {method: 'post', body: JSON.stringify(data)})
      .then(x => x.json())
      .then(serverErrorCatch)
      .then(x => this._parent.bid = this.boardId) // Works only if no error (and if was actual change)
      .catch(serverErrorLog);
  }
}

class BoardDataModel {
  @observable addrOffset = 0;
  @observable pins = [0, 0, 0, 0, 0, 0, 0, 0]

  constructor(parent) {
    makeObservable(this);
    this._parent = parent;
  }

  @action
  togglePin(pin) {
    this.pins.splice(pin, 1, !this.pins[pin] ? 1 : 0);
    this.update();
  }

  @action
  setFromMasks({pins}) {
    _.each(_.range(0, 8), pin => {
      this.pins[pin] = !!(pins & (1 << pin));
    })
  }

  @action
  setAddrOffset(x) {
    this.addrOffset = parseInt(x);
  }

  update() {
    let pins = 0;

    _.each(_.range(0, 8), pin => {
      pins |= this.pins[pin] ? (1 << pin) : 0;
    })

    fetch('/data/' + this._parent.bid, {method: 'post', body: JSON.stringify({pins, addr: this.addrOffset})})
      .then(x => x.json())
      .then(serverErrorCatch)
      .catch(serverErrorLog);
  }
}

class BoardModel {
  @observable bid = 0;
  @observable config = null;
  @observable data = null;

  constructor(bid) {
    this.bid = bid;
    makeObservable(this);
    this.data = new BoardDataModel(this);
    this.config = new BoardConfigModel(this);
    this.config.boardId = bid;
  }

  @action
  fetchConfig(boardId) {
    const bid = (boardId || this.bid);

    return fetch('/config/' + bid)
      .then(x => x.json())
      .then(x => {
        serverErrorCatch(x);
        this.config.setFromMasks(x.data);
        this.config.setNewStPin(x.data.startingPin);
        this.data.setAddrOffset(x.data.dataOffset);
        this.config.setLoaded(true);
        this.bid = bid;
      })
      .catch(e => {
        serverErrorLog(e);
        this.config.setLoaded(false);
      });
  }

  @action
  fetchData() {
    if (!this.data.addrOffset) {
      throw new Error('Data offset need to be set before data fetch');
    }

    return fetch('/data/' + this.bid + '/' + this.data.addrOffset)
      .then(x => x.json())
      .then(x => {
        serverErrorCatch(x);
        this.data.setFromMasks(x.data);
      })
      .catch(serverErrorLog);
  }
}

export {PinConfigModel, BoardConfigModel, BoardDataModel, BoardModel};
