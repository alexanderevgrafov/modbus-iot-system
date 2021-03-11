const _ = require('lodash');
const {types} = require('mobx-state-tree');
const {CommonModel} = require('./Common');

const CommonBoardConfigModel = types.compose('BoardConfigModel',
  CommonModel,
  types.model('',
    {
      boardId: 0,
      typeId: 0,
      startingPin: 0,
      pinsRead: 0,
      pinsWrite: 0,
      pinsAddr: 0,
    })
)

const CommonBoardDataModel = types.compose('CommonBoardDataModel',
  CommonModel,
  types.model('BoardDataModel',
    {
      pins: 0,
      readPins: 0,
    })
    .views(self => {
      return {
        isOn(pin) {
          return !!(self.pins & (1 << pin));
        },

        isReadOn(pin) {
          return !!(self.readPins & (1 << pin));
        }
      }
    })
    .actions(self => {
        return {
          togglePin(pin, force) {
            if (!_.isUndefined(force)) {
              if (!!force) {
                self.pins |= (1 << pin);
              } else {
                self.pins &= 0xFF ^ (1 << pin);
              }
            } else {
              self.pins ^= (1 << pin);
            }

            self.save();
          }
        }
      }
    )
)

const CommonBoardSettingsModel = types.compose('BoardSettingsModel',
  CommonModel,
  types.model('', {
    refreshPeriod: 0,
  })
)


const CommonBoardStatusModel = types.compose('BoardStatusModel',
  CommonModel,
  types.model('', {
    lastError: '',
  })
)

module.exports = {CommonBoardConfigModel, CommonBoardDataModel, CommonBoardSettingsModel, CommonBoardStatusModel};
