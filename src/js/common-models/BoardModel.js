const _ =require('lodash');
const {types, getParent} =require( 'mobx-state-tree');
//const {serverErrorCatch} =require( '../client/Utils');
const {CommonModel} =require('./Common');

const CommonBoardConfigModel = types.compose('BoardConfigModel',
  CommonModel,
  types.model('',
    {
      loaded: false,
      boardId: 0,
      startingPin: 0,
      //    pins: types.array(PinConfigModel),
      pinsRead: 0,
      pinsWrite: 0,
      pinsAddr: 0,
    })
    .actions(self => {
      return {
        // afterCreate() {
        //   _.each(_.range(0, 8), pin =>
        //     self.pins.push(PinConfigModel.create({pin}))
        //   )
        // },

        setFromMasks({read, write, addr}) {
          // _.each(_.range(0, 8), pin => {
          //   const item = self.getPin(pin);
          //
          //   item.read = !!(read & (1 << pin));
          //   item.write = !!(write & (1 << pin));
          //   item.addr = (addr >> (pin * 4)) & 0xF;
          // })

          self.set({
            pinsRead: read, pinsWrite: write, pinsAddr: addr
          })
        },

        pinAddr(pin) {
          return (self.pinsAddr >> (pin * 4)) & 0xF;
        },

        isPinWrite(pin) {
          return self.pinsWrite | (1 << pin);
        },

        isPinRead(pin) {
          return self.pinsRead | (1 << pin);
        },

        setPinAddr(pin, addr) {
          if (!!addr) {
            self.pinsAddr |= (addr & 0xF) << (4 * pin);
          } else {
            self.pinsAddr &= 0xffffffff ^ (0xF << (4 * pin));
          }
        },

        setPinWrite(pin, x) {
          if (!!x) {
            self.pinsWrite |= (1 << pin);
          } else {
            self.pinsWrite &= 0xFF ^ (1 << pin);
          }
        },

        setPinRead(pin, x) {
          if (!!x) {
            self.pinsRead |= (1 << pin);
          } else {
            self.pinsRead &= 0xFF ^ (1 << pin);
          }
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

        // getPin(pin) {
        //   return _.find(self.pins, x => x.pin === pin);
        // },

 /*       save() {
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
        }*/
      }
    })
)

const CommonBoardDataModel = types.compose('CommonBoardDataModel',
  CommonModel,
  types.model('BoardDataModel',
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

       /* save() {
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
        }*/
      }
    })
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
