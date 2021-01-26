import {appState} from './AppState';

const serverErrorCatch = x => {
  if (!x.ok) {
    throw ('Server error:' + x.message)
  }
  return x;
}
const serverErrorLog = e => console.log('Server Error:', e);
const serverBoardError = bid => e => {
  appState.setErrorItem(bid, e);
  const board = this.getBoard(bid);
  board.setLastError(e);
}

export {serverErrorCatch, serverErrorLog, serverBoardError}
