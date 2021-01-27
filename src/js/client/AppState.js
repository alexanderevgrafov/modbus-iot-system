import {createContext} from 'react';
import {types} from 'mobx-state-tree'
import {serverErrorCatch, serverErrorLog} from './Utils';
import {BoardModel} from './BoardModel';

const ComPortModel = types.model('ComPortModel', {
  path: '',
  manufacturer: '',
})

const AppState = types
  .model('Application State', {
    boards: types.array(BoardModel),
    allPorts: types.array(ComPortModel),
    errors: types.array(types.string),
    comPort: '',
  })
  .actions(self => {
    return {
      getBoard(bid) {
        // if (!self.boards[bid]) {
        //   self.addBoard(bid);
        // }
        return _.find(self.boards, {bid});
      },

      setPort(port, allPorts = null) {
        self.comPort = port;

        if (allPorts) {
          self.allPorts = allPorts;
        }

        fetch('/setport', {method: 'post', body: JSON.stringify({port})})
          .then(x => x.json())
          .then(serverErrorCatch)
          .catch(serverErrorLog);
      },

      addBoard(bid) {
        return bid && self.boards.push(BoardModel.create({bid}));
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
        return _.keys(_.compact(self.boards)).join(',');
      },

      setErrorItem(bid, e) {
        self.errors.push(e.message || e);
        if (self.errors.length > 10) {
          self.errors.shift();
        }
      },

      save() {
        const data = {
          boards: _.keys(self.boards).join(','),
          port: self.comPort
        }

        fetch('/state', {method: 'post', body: JSON.stringify(data)})
          .then(x => x.json())
          .then(x => {
            serverErrorCatch(x);
          })
          .catch(serverErrorLog);
      },

      load() {
        return fetch('/state')
          .then(x => x.json())
          .then(x => {
            serverErrorCatch(x);

            self.setPort(x.data.port, x.data.ports);

            _.each(_.compact(x.data.boards.split(',')), bid => self.addBoard(parseInt(bid)))
          })
          .catch(serverErrorLog);
      }
    }
  })

//const appState = AppState.create();


const AppStateContext = createContext();

export {AppStateContext, AppState};
