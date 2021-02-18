const _ = require('lodash');
const {types, getParent, getSnapshot} = require('mobx-state-tree');
const {
  CommonBoardConfigModel,
  CommonBoardDataModel,
  CommonBoardStatusModel: ServerBoardStatusModel,
  CommonBoardSettingsModel: ServerBoardSettingsModel
} = require('../../common-models/BoardModel');
const {CommonModel} = require('../../common-models/Common');

const ServerBoardConfigModel = types.compose('ServerBoardConfigModel',
  CommonBoardConfigModel,
  types.model('',
    {})
    .actions(self => {
      return {
        save() {
          const parent = getParent(self);
          const {bid} = parent;

          console.log('SAVING Config to board', bid);

          // const parent = getParent(self);
          // const {bid} = parent;
          // const data = {read: 0, write: 0, addr: 0, bid: self.boardId, startingPin: self.startingPin};
          //
          // _.each(_.range(0, 8), pin => {
          //   const item = self.getPin(pin);
          //
          //   data.read |= item.read ? (1 << pin) : 0;
          //   data.write |= item.write ? (1 << pin) : 0;
          //   data.addr |= (item.addr & 0xF) << (4 * pin);
          // })
          //
          // fetch('/config/' + bid, {method: 'post', body: JSON.stringify(data)})
          //   .then(x => x.json())
          //   .then(serverErrorCatch)
          //   .then(() => {
          //     parent.setId(self.boardId);
          //     parent.clearLastError();
          //   }) // Works only if no error (and if was actual change)
          //   .catch(parent.setBoardError);
        }
      }
    })
)

const ServerBoardDataModel = types.compose('BoardDataModel',
  CommonBoardDataModel,
  types.model('',
    {})
    .actions(self => {
      return {
        save() {
          const parent = getParent(self);
          const {bid} = parent;

          console.log('SAVE data to board', bid);
          // let pins = 0;
          //
          // _.each(_.range(0, 8), pin => {
          //   pins |= self.pins[pin] ? (1 << pin) : 0;
          // })
          //
          // fetch('/data/' + bid, {method: 'post', body: JSON.stringify({pins, addr: self.addrOffset})})
          //   .then(x => x.json())
          //   .then(serverErrorCatch)
          //   .then(() => parent.clearLastError())
          //   .catch(parent.setBoardError);
        }
      }
    })
)

const ServerBoardModel = types.compose('BoardModel',
  CommonModel,
  types.model('',
    {
      bid: types.identifierNumber,
      status: types.maybeNull(ServerBoardStatusModel),
      settings: types.maybeNull(ServerBoardSettingsModel),
      config: types.maybeNull(ServerBoardConfigModel),
      data: types.maybeNull(ServerBoardDataModel),
    })
    .actions(self => {
      let modServer;

      return {
        afterCreate() {
          //    console.log('1. Board afterCreate', self.bid, getSnapshot(self));
          self.data = self.data || ServerBoardDataModel.create();
          self.config = self.config || ServerBoardConfigModel.create();
          self.status = self.status || ServerBoardStatusModel.create();
          self.settings = self.settings || ServerBoardSettingsModel.create();
          self.config.boardId = self.bid;

          console.log('2. Board afterCreate', self.bid, getSnapshot(self));
        },

        init(ms) {
          modServer = ms;

          self.fetchConfig();
          self.fetchData();
        },

        fetchConfig() {
          const {bid} = self;

          console.log('Get Config from', bid);

          // return fetch('/config/' + bid)
          //   .then(x => x.json())
          //   .then(x => {
          //     serverErrorCatch(x);
          //     self.config.setFromMasks(x.data);
          //     self.config.setNewStPin(x.data.startingPin);
          //     self.data.setAddrOffset(x.data.dataOffset);
          //     self.config.setLoaded(true);
          //     //          self.bid = bid;
          //
          //     self.clearLastError();
          //   })
          //   .catch(e => {
          //     self.setBoardError(e);
          //     self.config.setLoaded(false);
          //   });
        },

        fetchData() {
          console.log('Get Data from', self.bid);
          // if (!self.data.addrOffset) {
          //   const msg = 'Data offset need to be set before data fetch';
          //   self.setBoardError(msg);
          //   return; // Promise.reject();
          // }
          //
          // return fetch('/data/' + self.bid + '/' + self.data.addrOffset)
          //   .then(x => x.json())
          //   .then(x => {
          //     serverErrorCatch(x);
          //     self.data.setFromMasks(x.data);
          //     self.clearLastError();
          //   })
          //   .catch(self.setBoardError);
        },

        // setPeriod(x) {
        //   self.refreshPeriod = parseInt(x);
        // },
        //
        // setId(x) {
        //   self.bid = parseInt(x);
        // },

        setByClient(data) {
          self.set(data, 'client');
        },

        clearLastError() {
          self.setLastError();
        },

        setLastError(msg) {
          self.set({lastError: msg});
        },

        setBoardError(e) {
          const appState = getParent(getParent(self));
          appState.setErrorItem(e);
          self.setLastError(e.message || e);
        }
      }
    })
)


module.exports = {ServerBoardConfigModel, ServerBoardDataModel, ServerBoardModel};
