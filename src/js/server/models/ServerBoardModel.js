const _ = require('lodash');
const {types, getRoot, getParent, getSnapshot} = require('mobx-state-tree');
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
      let board;
      let manager;

      try {
        board = getParent(self);
        manager = getRoot(self);
      } catch (e) {
        console.log('Board config error in INIT', e.message);
      }

      return {
        saveToBoard() {
          const app = manager.getApp();

          app.modServer.setBoardConfig({
            id: board.bid,
            bid: board.bid,
            read: self.pinsRead,
            write: self.pinsWrite,
            addr: self.pinsAddr,
            startingPin: self.startingPin,
          })
            .then(board.clearLastError)
            .catch(board.setLastError);
        }
      }
    })
)

const ServerBoardDataModel = types.compose('BoardDataModel',
  CommonBoardDataModel,
  types.model('',
    {})
    .actions(self => {
      let board;
      let manager;

      try {
        board = getParent(self);
        manager = getRoot(self);
      } catch (e) {
        console.log('Board data error in INIT', e.message);
      }


      return {
        saveToBoard() {
          const app = manager.getApp();

          app.modServer.setBoardData({
            id: board.bid,
            pins: self.pins,
            addr: board.dataOffset,
          })
            .then(board.clearLastError)
            .catch(board.setLastError);
        },
      }
    })
)

const ServerBoardModel = types.compose('BoardModel',
  CommonModel,
  types.model('',
    {
      bid: types.identifierNumber,
      dataOffset: 0,
      status: types.maybeNull(ServerBoardStatusModel),
      settings: types.maybeNull(ServerBoardSettingsModel),
      config: types.maybeNull(ServerBoardConfigModel),
      data: types.maybeNull(ServerBoardDataModel),
    })
    .actions(self => {
      const manager = getRoot(self);
      let refreshTimer;

      return {
        afterCreate() {
          //    console.log('1. Board afterCreate', self.bid, getSnapshot(self));
          self.data = self.data || ServerBoardDataModel.create();
          self.config = self.config || ServerBoardConfigModel.create();
          self.status = self.status || ServerBoardStatusModel.create();
          self.settings = self.settings || ServerBoardSettingsModel.create();
          self.config.boardId = self.bid;

          //   console.log('2. Board afterCreate', self.bid, getSnapshot(self));
        },

        beforeDestroy() {
          clearInterval(refreshTimer);
        },

        async init(ms) {
          modServer = ms;

          try {
            await self.fetchConfig();
            await self.fetchData();
            self.clearLastError();
          } catch (e) {
            self.setLastError(e);
          }
        },

        set(dataJson, source) {
          let changed = {};

          _.each(['data', 'config', 'status', 'settings'], branch => {
            const json = dataJson[branch];

            if (json) {
              const patch = self[branch].set(json, source);
              //      console.log('Board', self.bid, branch, 'set as', json);

              if (_.keys(patch).length) {
                changed = {...changed, [branch]: patch};

                if (source !== 'board' && self[branch].saveToBoard) {
                  self[branch].saveToBoard();
                }
              }
            }
          })

          if (_.keys(changed)) {
            self.onChange(changed);
          }
        },

        onChange(changed) {
          let interval = _.get(changed, 'settings.refreshPeriod');

          manager.onBoardChange(self.bid, changed);

             // console.log('BRD CHNG', self.bid, changed);

          if (!_.isUndefined(interval)) {
            clearInterval(refreshTimer);

            if (interval) {
              refreshTimer = setInterval(self.fetchData, interval);
            }
          }
        },

        setDataPin(pin, val) {
          let {pins} = self.data;

          if (!!val) {
            pins |= (1 << pin);
          } else {
            pins &= 0xFF ^ (1 << pin);
          }

          self.set({data: {pins}});
        },

        setDataOffset(x) {
          self.dataOffset = x
        },

        async fetchConfig() {
          try {
            const {bid} = self;
            const {dataOffset, ...config} = await modServer.getBoardConfig(bid);

            self.set({config}, 'board');
            self.setDataOffset(dataOffset);
          } catch(e) {
            self.setLastError(e);
          }
        },

        async fetchData() {
          try {
            const data = await modServer.getBoardData(self.bid, self.dataOffset);

            self.set({data}, 'board');
          } catch (e) {
            self.setLastError(e);
          }
        },

        clearLastError() {
          self.setLastError('');
        },

        setLastError(e) {
          self.set({status: {lastError: e.message || e}});
        },
      }
    })
)


module.exports = {ServerBoardConfigModel, ServerBoardDataModel, ServerBoardModel};
