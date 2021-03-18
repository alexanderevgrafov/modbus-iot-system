const _ = require('lodash');
const fs = require('fs');
const CONFIG_STORAGE_FILE = 'mock_board';

class ModbusRtuMock {
  data = [];
  id = 0;

  readInputRegisters(addr, count) {
    try {
      this.mockError();

      console.log('BFRL0');
      this.load();
      console.log('BFRL1');

      const data = this.data.slice(addr, addr + count);

      console.log('MockRead', addr, count, data);

      return new Promise(res => {
        setTimeout(() => res({data}), 500);
      });
    } catch (e) {
   //   console.log('CTCHD', e)
      return Promise.reject(e.message || e);
    }
  }

  readHoldingRegisters(addr, count) {
    return this.readInputRegisters(addr, count);
  }

  writeRegisters(addr, dataArr) {
    try {
      this.mockError();

      this.load();

      console.log('MockWrite', dataArr);

      _.each(dataArr, (word, index) => {
        this.data[addr + index] = word
      });

      this.save();

    } catch (e) {
      return Promise.reject(e.message || e);
    }

    return Promise.resolve();
  }

  connectRTUBuffered(port, options, cb) {
    cb();
    return Promise.resolve();
  }

  setTimeout(val) {
    return Promise.resolve();
  }

  setID(id) {
    console.log('MockSetId', id)
    this.id = id;

    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  load() {
    // try {
      this.data = JSON.parse(fs.readFileSync(this.fileName()));
    // } catch (e) {
    //   console.log('MockLoadFail', e);
    //   this.data = _.fill(Array(20), 0);
    // }
  }

  save() {
    // console.log('Board recieved', this.data);
    fs.writeFileSync(this.fileName(), JSON.stringify(this.data, null, '  '))
  }

  fileName() {
    return CONFIG_STORAGE_FILE + this.id + '.json'
  }

  mockError(msg){
    return;
    if (Math.random() < .3) {
      throw new Error(msg ||'Mocked Error');
    }
  }
}

module.exports = ModbusRtuMock;
