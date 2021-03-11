import {createContext} from 'react';
import {types, getParent, values} from 'mobx-state-tree'
import {serverErrorCatch} from '../Utils';
import {BoardModel} from './ClientBoardModel';

const ComPortModel = types.model('ComPortModel', {
  path: '',
  manufacturer: '',
})

const ErrorRecordModel = types.model('ErrorRecordModel', {
  text: '',
  date: types.Date,
})

const BoardScanner = types
  .model('Board Scanner Model', {
    from: 1,
    to: 10,
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

const LayoutControlModel = types
  .model('Layout Control Model', {
    name: types.identifier,
    type: '',
    label: '',
    state: types.frozen({}),
  })
  .actions(self => {
    return {
      changeState(data) {
        self.state = data;
      }
    }
  })

const AppState = types
  .model('Application State', {
    boards: types.map(BoardModel),
    scanner: BoardScanner,
    allPorts: types.array(ComPortModel),
    errors: types.array(ErrorRecordModel),
    layout: types.map(LayoutControlModel),
    comPort: '',
  })
  .views(self => {
    return {
      allBoards() {
        return values(self.boards);
      }
    }
  })
  .actions(self => {
    return {
      getBoard(bid) {
        const board = self.boards.get(bid);

        if (!board) {
          throw new Error('Board not found by id=' + bid);
        }

        return board;
      },

      setPort(port, allPorts = null) {
        const prevPort = self.comPort;

        if (allPorts) {
          self.allPorts = allPorts;
        }

        if (_.find(self.allPorts, p => p.path === port)) {
          self.comPort = port;
        } else {
          self.comPort = '';
        }

        if (self.comPort !== prevPort) {
          fetch('/setport', {method: 'post', body: JSON.stringify({port: self.comPort})})
            .then(x => x.json())
            .then(serverErrorCatch)
            .catch(self.setErrorItem);
        }
      },

      addBoard(data) {
        return data && self.boards.put(data);
      },

      addLayout(name, {type, label, state}) {
        return self.layout.put({name, type, label, state});
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

      clearLists() {
        self.boards.clear();
        self.layout.clear();
      },

      getBoardsList() {
        return _.map(self.boards, x => x.bid).join(',');
      },

      setErrorItem(e) {
        const errItem = ErrorRecordModel.create({text: e.message || e, date: new Date})
        self.errors.push(errItem);
        if (self.errors.length > 10) {
          self.errors.shift();
        }
      },

      clearErrors() {
        self.errors = [];
      },

      load() {
        return fetch('/state')
          .then(x => x.json())
          .then(serverErrorCatch)
          .then(x => {
            const {port, ports, boards, layout} = x.data;

            self.setPort(port, ports);
            self.clearLists();

            boards && _.each(boards, b => self.addBoard(b));
            layout && _.each(layout, (obj, name) => self.addLayout(name, obj));
          })
          .catch(self.setErrorItem);
      },

      onLayoutControlChange(name, data) {
        const layout = self.layout.get(name);

        layout && layout.changeState(data);

        fetch('/layout/change', {method: 'post', body: JSON.stringify({[name]: data})})
          .then(x => x.json())
          .then(serverErrorCatch)
          .catch(self.setErrorItem);
      },

      updateLayout(payload) {
        const {id, data} = payload;
        const control = self.layout.get(id);

        control.changeState(data.state);
      }
    }
  })

const AppStateContext = createContext({});

export {AppStateContext, AppState};
