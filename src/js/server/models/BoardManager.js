const _ = require('lodash');
//const {getParent} = require('mobx-state-tree');
const {types, applySnapshot, applyAction, onPatch, getSnapshot} = require('mobx-state-tree');

const {ServerBoardModel} = require('./ServerBoardModel');

const BoardsManager = types
  .model({
    boards: types.map(ServerBoardModel),
  })
  .actions(self => {
    let application;
    const eventHandlers = [];

    return {
      afterCreate() {
        onPatch(self.boards, patch => {
          // console.log('PATCH for boards', patch);
          if ((patch.op === 'add' || patch.op === 'remove') && patch.path.match(/^\/\d+$/)) {
            console.log('Emitted state reload by', patch);
            application.emit('stateReload');
          }
        })
      },

      getApp() {
        return application;
      },

      getBoard(bid) {
        const board = self.boards.get(bid);

        if (!board) {
          throw new Error('Board not found by id=' + bid);
        }

        return board;
      },
      /*
      setBoard(bid, json) {
         // TODO: Validate data before apply on models.
    //    const board = _.find(self.boards, board=>board.bid===bid);
        const board = self.boards.get(bid);

        if (board) {
         // const parent = getParent(self);
          board.set(json);


        //  application.emit(bid, {...json});
        }
      },
*/
      addBoard(data, ms) {
        const board = self.boards.put(data);

        board.init(ms);
        board.onChange(data);

        return board;
      },

      setBoardId(cur, next) {
        const board = self.getBoard(cur);
        let nextBoard

        try {
          nextBoard = self.getBoard(next);
        } catch (e) {

        }

        if (nextBoard) {
          throw new Error('Board with id=' + next + ' already exists');
        }

        application.modServer.setBoardId(cur, next)
          .then(() => {
            const snap = _.assign({}, getSnapshot(board));

            // console.log('1.Snapshot', next, snap);

            snap.bid = next;
            _.set(snap, 'config.boardId', next);
            //
            // console.log('2.Snapshot', next, snap);

            /*     applyAction(self, [
                   {
                     name: 'addBoard',
                     args: [snap, application.modServer]
                   }, {
                     name: 'removeBoard',
                     args: [cur]
                   }])*/
            self.addBoard(snap, application.modServer)
            self.removeBoard(cur);
          })
          .catch(handleModServerError(cur))
      },

      removeBoard(bid) {
        self.boards.delete(bid);
      },

      getBoardsJson() {
        const snap = getSnapshot(self.boards);

        //     console.log('BOARDS', snap);
        return snap;
      },

      init(data, app) {
        application = app;

        console.log('Init boards manager');

        _.each(data.boards, dt => {
          self.addBoard(dt, app.modServer);
        })
      },

      onBoardChange(bid, changes) {
        if (!_.keys(changes).length) {
          return;
        }

        this.emit(bid, changes);

        const boardHandlers = _.filter(eventHandlers, h => h.bid === bid);

   //     console.log('BC', bid, changes, boardHandlers, eventHandlers);

        if (boardHandlers.length) {
          const board = self.getBoard(bid);

          _.each(boardHandlers, ({path, cb}) => {

      //      console.log('BC2', changes, path, _.get(changes, path));

            if (!_.isUndefined(_.get(changes, path))) {
              cb(board, changes);
            }
          })
        }
      },

      emit(bid, data) {
        application.emit('boardSet', {bid, data});
      },

      setBoardEvent(bid, path, cb) {
        const handler = {bid, path, cb};

        eventHandlers.push(handler);

        return handler;
      },

      removeBoardEvent(handler) {
        const index = eventHandlers.indexOf(handler);

        if (index >= 0) {
          eventHandlers.splice(index, 1);
        }
      },
    }
  })

module.exports = BoardsManager;
