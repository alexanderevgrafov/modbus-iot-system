import {types, getParent, getSnapshot} from 'mobx-state-tree'
import {serverErrorCatch} from '../Utils'
import {
  CommonBoardConfigModel,
  CommonBoardDataModel,
  CommonBoardStatusModel as ClientBoardStatusModel,
  CommonBoardSettingsModel
} from '../../common-models/BoardModel';
import {CommonModel} from '../../common-models/Common';

const ClientBoardConfigModel = types.compose('ClientBoardConfigModel',
  CommonBoardConfigModel,
  types.model('',
    {
    })
    .views(self => {
      return {
        pinAddr(pin) {
          const bits = (self.pinsAddr >> (pin * 4)) & 0xF
          const addr = ( bits & 0x7 ) * ( bits & 0x8 ? -1 : 1);
          return addr;
        },

        isPinWrite(pin) {
          return self.pinsWrite & (1 << pin);
        },

        isPinRead(pin) {
          return self.pinsRead & (1 << pin);
        },
      }
    })
    .actions(self => {
      return {
        setPinAddr(pin, addr) {
          self.pinsAddr &= 0xffffffff ^ (0xF << (4 * pin));
          if (!!addr) {
            const bits = ( Math.abs(addr) & 0x7) | ( addr > 0 ? 0 : 0x8);
            self.pinsAddr |= bits << (4 * pin);
          }
        },

        setPinWrite(pin, x) {
          if (!!x) {
            self.pinsWrite |= (1 << pin);
            self.setPinRead(pin, false);
          } else {
            self.pinsWrite &= 0xFF ^ (1 << pin);
          }
        },

        setPinRead(pin, x) {
          if (!!x) {
            self.pinsRead |= (1 << pin);
            self.setPinWrite(pin, false);
          } else {
            self.pinsRead &= 0xFF ^ (1 << pin);
          }
        },

        save() {
          const parent = getParent(self);
          const json = getSnapshot(self);

          parent.save({config: json});
        }
      }
    })
);

const ClientBoardDataModel = types.compose('BoardDataModel',
  CommonBoardDataModel,
  types.model('',
    {
    })
    .actions(self => {
      return {
        save() {
          const parent = getParent(self);
          const json = getSnapshot(self);

          parent.save({data: json});
        }
      }
    })
)
const ClientBoardSettingsModel = types.compose('BoardSettingsModel',
  CommonBoardSettingsModel,
  types.model('',
    {
    })
    .actions(self => {
      return {
        save() {
          const parent = getParent(self);
          const json = getSnapshot(self);

          parent.save({settings: json});
        }
      }
    })
)

const ClientBoardModel = types.compose('BoardModel',
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
        save(json) {
          fetch('/board/' + self.bid, {method: 'post', body: JSON.stringify(json)})
            .then(x => x.json())
            .then(serverErrorCatch)
            .then(() => self.clearLastError())
            .catch(self.setBoardError);
        },

        remove(){
          fetch('/board/' + self.bid, {method: 'delete'})
            .then(x => x.json())
            .then(serverErrorCatch)
            .catch(self.setBoardError);
        },

        setNewId(newbid){
          const json = {
            bid: self.bid,
            newbid
          };

          fetch('/board/newid', {method: 'post', body: JSON.stringify(json)})
            .then(x => x.json())
            .then(serverErrorCatch)
            .then(() => self.clearLastError())
            .catch(self.setBoardError);
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
);

export {
  ClientBoardConfigModel as BoardConfigModel,
  ClientBoardDataModel as BoardDataModel,
  ClientBoardModel as BoardModel
};
