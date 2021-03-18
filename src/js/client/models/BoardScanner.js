import {getParent, types} from 'mobx-state-tree';
import {serverErrorCatch} from '../Utils';

const BoardScanner = types
  .model('Board Scanner Model', {
    from: 1,
    to: 230,
    next: 1,
    scanning: false,
    list: types.array(types.number),
  })
  .actions(self => {
    return {
      toggleScanning() {
        self.scanning = !self.scanning;

        self.scanNext();
      },

      scanNext() {
        self.scanId(self.next)
          .then(x => {
            if (x) {
              self.setNext(self.next + 1);
              if (x.ok) {
                self.setList([...self.list, x.bid]);
              }
              if (self.next > self.to) {
                self.setScanning(false);
                self.setNext(self.from);
              } else {
                self.scanNext();
              }
            }
          })
      },

      manualAddBoard(bid) {
        const body = JSON.stringify({bid});

        return fetch('/add-board', {method: 'post', body})
          .then(x => x.json())
          .then(serverErrorCatch)
          .catch(getParent(self).setBoardError);
      },

      resetScan() {
        self.setScanning(false);
        self.setList([]);
        self.setNext(self.from);
      },

      scanId(bid) {
        if (self.scanning) {
          return fetch('/config/' + bid)
            .then(x => x.json())
            .then(x => ({bid, ...x}))
            .catch(getParent(self).setErrorItem);
        } else {
          return Promise.resolve(false);
        }
      },

      setFrom(x) {
        self.next = self.from = parseInt(x)
      },

      setTo(x) {
        self.to = parseInt(x)
      },

      setNext(x) {
        self.next = x
      },

      setScanning(x) {
        self.scanning = !!x
      },

      setList(x) {
        self.list = x
      },
    }
  })

export {BoardScanner}
