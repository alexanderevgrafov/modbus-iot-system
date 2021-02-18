import {types, getParent} from 'mobx-state-tree'
import {serverErrorCatch} from '../client/Utils'
import {CommonBoardConfigModel, CommonBoardDataModel} from '../../common-models/BoardModel';
import {CommonModel} from '../../common-models/Common';

const ClientBoardConfigModel = types.compose('ClientBoardConfigModel',
  CommonBoardConfigModel,
  types.model('',
    {
      loaded: false,
    })
    .actions(self => {
      return {
        save() {
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
)

const ClientBoardDataModel = types.compose('BoardDataModel',
  CommonBoardDataModel,
  types.model('',
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

        save() {
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
)

const CommonBoardModel = types.compose('BoardModel',
  CommonModel,
  types.model('',
    {
      bid: types.identifierNumber,
      status: types.maybeNull(ClientBoardStatusModel),
      settings: types.maybeNull(ClientBoardSettingsModel),
      config: types.maybeNull(ClientBoardConfigModel),
      data: types.maybeNull(ClientBoardDataModel),
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
)

export {PinConfigModel, BoardConfigModel, BoardDataModel, BoardModel};
