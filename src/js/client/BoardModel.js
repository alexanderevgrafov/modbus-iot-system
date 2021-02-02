import {types, getParent} from 'mobx-state-tree'
import {serverErrorCatch} from './Utils'

const PinConfigModel = types
  .model('PinConfigModel',
    {
      pin: types.identifierNumber,
      read: false,
      write: false,
      addr: 0,
    })
  .actions(self => {
    return {
      setRead(x) {
        self.read = x;
        x && (self.write = false);
      },

      setWrite(x) {
        self.write = x;
        x && (self.read = false);
      },

      setAddr(x) {
        const {startingPin} = getParent(getParent(self));
        x = parseInt(x) || 0
        x = x > 0 && Math.min(startingPin + 7, Math.max(x, startingPin));
        self.addr = x > 0 ? x - self.pin - startingPin : 0;
      }
    }
  })

const BoardConfigModel = types
  .model('BoardConfigModel',
    {
      loaded: false,
      boardId: 0,
      startingPin: 0,
      pins: types.array(PinConfigModel),
    })
  .actions(self => {
    return {
      afterCreate() {
        _.each(_.range(0, 8), pin =>
          self.pins.push(PinConfigModel.create({pin}))
        )
      },

      setFromMasks({read, write, addr}) {
        _.each(_.range(0, 8), pin => {
          const item = self.getPin(pin);

          item.read = !!(read & (1 << pin));
          item.write = !!(write & (1 << pin));
          item.addr = (addr >> (pin * 4)) & 0xF;
        })
      },

      setNewId(x) {
        self.boardId = parseInt(x);
      },

      setNewStPin(x) {
        self.startingPin = parseInt(x);
      },

      setLoaded(x) {
        self.loaded = !!x;
      },

      getPin(pin) {
        return _.find(self.pins, x => x.pin === pin);
      },

      update() {
        const parent = getParent(self);
        const {bid} = parent;
        const data = {read: 0, write: 0, addr: 0, bid: self.boardId, startingPin: self.startingPin};

        _.each(_.range(0, 8), pin => {
          const item = self.getPin(pin);

          data.read |= item.read ? (1 << pin) : 0;
          data.write |= item.write ? (1 << pin) : 0;
          data.addr |= (item.addr & 0xF) << (4 * pin);
        })

        fetch('/config/' + bid, {method: 'post', body: JSON.stringify(data)})
          .then(x => x.json())
          .then(serverErrorCatch)
          .then(() => {
            parent.setId(self.boardId);
            parent.clearLastError();
          }) // Works only if no error (and if was actual change)
          .catch(parent.setBoardError);
      }
    }
  })

const BoardDataModel = types
  .model('BoardDataModel',
    {
      addrOffset: 0,
      pins: types.array(types.boolean),
      readPins: types.array(types.boolean),
    })
  .actions(self => {
    return {
      afterCreate() {
        self.pins = self.readPins = [false, false, false, false, false, false, false, false];
      },
      togglePin(pin) {
        self.pins.splice(pin, 1, !self.pins[pin]);
        self.update();
      },

      setFromMasks({pins, readPins}) {
        _.each(_.range(0, 8), pin => {
          self.pins[pin] = !!(pins & (1 << pin));
          self.readPins[pin] = !!(readPins & (1 << pin));
        })
      },

      setAddrOffset(x) {
        self.addrOffset = parseInt(x);
      },

      update() {
        const parent = getParent(self);
        const {bid} = parent;
        let pins = 0;

        _.each(_.range(0, 8), pin => {
          pins |= self.pins[pin] ? (1 << pin) : 0;
        })

        fetch('/data/' + bid, {method: 'post', body: JSON.stringify({pins, addr: self.addrOffset})})
          .then(x => x.json())
          .then(serverErrorCatch)
          .then(() => parent.clearLastError())
          .catch(parent.setBoardError);
      }
    }
  })

const BoardModel = types
  .model('BoardModel',
    {
      bid: types.identifierNumber,
      lastError: '',
      refreshPeriod: 0,
      config: types.maybeNull(BoardConfigModel),
      data: types.maybeNull(BoardDataModel),
    })
  .actions(self => {
    return {
      afterCreate() {
        self.data = BoardDataModel.create();
        self.config = BoardConfigModel.create();
        self.config.boardId = self.bid;
      },

      fetchConfig(boardId) {
        const bid = (boardId || self.bid);

        return fetch('/config/' + bid)
          .then(x => x.json())
          .then(x => {
            serverErrorCatch(x);
            self.config.setFromMasks(x.data);
            self.config.setNewStPin(x.data.startingPin);
            self.data.setAddrOffset(x.data.dataOffset);
            self.config.setLoaded(true);
  //          self.bid = bid;

            self.clearLastError();
          })
          .catch(e => {
            self.setBoardError(e);
            self.config.setLoaded(false);
          });
      },

      fetchData() {
        if (!self.data.addrOffset) {
          const msg = 'Data offset need to be set before data fetch';
          self.setBoardError(msg);
          return; // Promise.reject();
        }

        return fetch('/data/' + self.bid + '/' + self.data.addrOffset)
          .then(x => x.json())
          .then(x => {
            serverErrorCatch(x);
            self.data.setFromMasks(x.data);
            self.clearLastError();
          })
          .catch(self.setBoardError);
      },

      setPeriod(x) {
        self.refreshPeriod = parseInt(x);
      },

      setId(x) {
        self.bid = parseInt(x);
      },

      clearLastError() {
        self.setLastError();
      },

      setLastError(msg) {
        self.lastError = msg;
      },

      setBoardError(e) {
        const appState = getParent(getParent(self));
        appState.setErrorItem(e);
        self.setLastError(e.message || e);
      }
    }
  })

export {PinConfigModel, BoardConfigModel, BoardDataModel, BoardModel};
