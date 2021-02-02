import {createContext} from 'react';
import {types, getParent} from 'mobx-state-tree'
import {serverErrorCatch, serverErrorLog} from './Utils';
import {BoardModel} from './BoardModel';

const ComPortModel = types.model('ComPortModel', {
  path: '',
  manufacturer: '',
})

const AppState = types
  .model('Application State', {
    boards: types.array(BoardModel),
    scanner: types
      .model('Board Scanner Model', {
        from: 1,
        to: 10,
        next: 1,
        scanning: false,
        list: []
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
                  self.next = self.next + 1;
                  if (x.ok) {
                    self.list = [...self.list, x.bid];
                  }
                  if (self.next > self.to) {
                    self.scanning = false;
                    self.next = self.from;
                  } else {
                    self.scanNext();
                  }
                }
              })
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

          setFrom(x) { self.from = x },

          setTo(x) { self.to = x },

          setList(x) { self.list = x },
        }
      }),
    allPorts: types.array(ComPortModel),
    errors: types.array(types.string),
    comPort: '',
  })
  .actions(self => {
    return {
      getBoard(bid) {
        return _.find(self.boards, {bid});
      },

      setPort(port, allPorts = null) {
        if (allPorts) {
          self.allPorts = allPorts;
        }

        if (_.find(self.allPorts, p => p.path === port)) {
          self.comPort = port;
        } else {
          self.comPort = '';
        }

        fetch('/setport', {method: 'post', body: JSON.stringify({port: self.comPort})})
          .then(x => x.json())
          .then(serverErrorCatch)
          .catch(self.setErrorItem);
      },

      addBoard(data) {
        return data && self.boards.push(BoardModel.create(data));
      },

      setBoardsList(list) {
        const newBoards = [];

        _.each(list.split(','), boardIdStr => {
          const bid = parseInt(boardIdStr.trim());
          if (bid) {
            const board = self.getBoard(bid) || BoardModel.create({bid});
            newBoards.push(board);
          }
        })

        return self.boards = newBoards;
      },

      getBoardsList() {
        return _.map(self.boards, x => x.bid).join(',');
      },

      setErrorItem(e) {
        self.errors.push(e.message || e);
        if (self.errors.length > 10) {
          self.errors.shift();
        }
      },

      clearErrors() {
        self.errors = [];
      },

      save() {
        const data = {
          boards: _.map(self.boards, b => _.pick(b, ['bid', 'refreshPeriod'])),
          port: self.comPort
        }

        fetch('/state', {method: 'post', body: JSON.stringify(data)})
          .then(x => x.json())
          .then(x => {
            serverErrorCatch(x);
          })
          .catch(self.setErrorItem);
      },

      load() {
        return fetch('/state')
          .then(x => x.json())
          .then(x => {
            serverErrorCatch(x);

            self.setPort(x.data.port, x.data.ports);

            x.data.boards && _.each(x.data.boards, b => self.addBoard(b))
          })
          .catch(self.setErrorItem);
      }
    }
  })

//const appState = AppState.create();


const AppStateContext = createContext();

export {AppStateContext, AppState};
