import * as React from 'react';
import {useState, useContext} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".
import {entries} from 'mobx';
import {Loader} from './Loader'
import {AppStateContext} from './models/AppState';

const ConfigLine = observer(({board, pin}) => {
  const {config, data} = board;
  const isRead = config.isPinRead(pin);
  const isWrite = config.isPinWrite(pin);
  const addr = config.pinAddr(pin);
  const {startingPin} = config;

  return <tr>
    <td onClick={() => config.setPinRead(pin, !isRead)}>Pin {pin}</td>
    <td><input onChange={e => config.setPinAddr(pin, parseInt(e.target.value))}
               value={addr ? addr : 0}/></td>
    <td onClick={() => {
      isRead ? config.setPinWrite(pin, true) :
        isWrite ? config.setPinWrite(pin, false) : config.setPinRead(pin, true)
    }}>
      D{startingPin + pin}
      {isWrite ? <>(output)
        <div onClick={e => {data.togglePin(pin); e.stopPropagation();}} className='button-like'
             key={pin}>D{startingPin + pin} {data.isOn(pin) ? 'ON' : 'OFF'}</div>
      </> : void 0}
      {isRead ? '(input'+(addr ? ' linked to ' + (addr + pin + startingPin)  : 0)+')' : void 0}
      {
        data.isReadOn(pin) ? '[ON]' : void 0
      }
    </td>
  </tr>
});

const useDebounced = (obj, attr) => useState(() => _.debounce(val => obj.set({[attr]: val}), 500));

const Configurator = observer(({board}) => {
  const [bid, setBid] = useState(board.bid);
  const [period, setPeriod] = useState(board.settings.refreshPeriod);
  const [debPer] = useDebounced(board.settings, 'refreshPeriod');

  return !board.config ? 'Configurator will be here' :
    <div className="board-config">
      ID: <input value={bid} onChange={e => setBid(parseInt(e.target.value))}/>
      <br/>
      <button onClick={() => board.setNewId(bid)}>Set new ID</button>
      StPin: <input value={board.config.startingPin}
                    onChange={e => board.config.set({'startingPin': parseInt(e.target.value)})}/>
      RefPer: <input value={period}
                     onChange={e => {
                       const val = parseInt(e.target.value);
                       setPeriod(val);
                       debPer(val);
                     }}/>
      <br/>
      <button onClick={() => board.settings.save()}>Save settings to board</button>
      <table>
        <tbody>
        {_.map(_.range(0, 8), pin =>
          <ConfigLine config={board.config} board={board} pin={pin} key={pin}/>
        )}
        </tbody>
      </table>
      <br/>
      <button onClick={() => board.config.save()}>Save config to board</button>
      <br/>
      <button onClick={() => board.remove()}>Remove</button>

    </div>
});


const Board = observer(({board}) => {
  return !board ? <Loader/> :
    <div className="board">
      <h3>Board #{board.bid}</h3>
      {board.status.lastError ? <pre>ERR: {board.status.lastError}</pre> : ''}
      <Configurator board={board}/>
    </div>
})

const Boards = observer(() => {
  const appState = useContext(AppStateContext);

  return <div id="boards">
    <div className='section-title'>Boards</div>
    {
      entries(appState.boards).map(([bid, board]) => <Board board={board} key={bid}/>)
    }
  </div>
})

export {Board, Boards}

