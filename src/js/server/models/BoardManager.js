const _ = require('lodash');
const {types, getSnapshot} = require('mobx-state-tree');

const {ServerBoardModel} = require('./ServerBoardModel');

const BoardsManager = types
  .model({
    boards: types.array(ServerBoardModel)
  })
  .actions(self => {
    return {
      setConfig(bid, data) {

      },

      setData(bid, data) {

      },

      addBoard(data, ms) {
        const board = ServerBoardModel.create(data);

        self.boards.push(board);

        board.init(ms);

        return board;
      },

      removeBoard(bid) {

      },

      renameBoard(bid, newBid) {

      },

      getBoardsJson(){
        return getSnapshot(self.boards);
      },

      init(data, state) {
        _.each(data.boards, dt => {
          self.addBoard(dt, state.modServer);
        })
      }
    }
  })

module.exports = BoardsManager;
