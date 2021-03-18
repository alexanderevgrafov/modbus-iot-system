import * as React from 'react';
import {useState, useContext} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".
import {entries} from 'mobx';
import {Loader} from './Loader'
import {AppStateContext} from './models/AppState';

const ConfigLine = observer(({config, pin}) => {
  const isRead = config.isPinRead(pin);
  const isWrite = config.isPinWrite(pin);
  const addr = config.pinAddr(pin);
  const {startingPin} = config;

  return <tr>
    <td onClick={() => config.setPinRead(pin, !isRead)}>D{startingPin + pin}{isRead ? '#' : void 0}</td>
    <td><input onChange={e => config.setPinAddr(pin, parseInt(e.target.value) - config.startingPin - pin)}
               value={addr ? config.startingPin + pin + addr : 0}/></td>
    <td onClick={() => config.setPinWrite(pin, !isWrite)}>D{startingPin + pin}{isWrite ? '#' : void 0}</td>
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
      StPin: <input value={board.config.startingPin}
                    onChange={e => board.config.set({'startingPin': parseInt(e.target.value)})}/>
      RefPer: <input value={period}
                     onChange={e => {
                       const val = parseInt(e.target.value);
                       setPeriod(val);
                       debPer(val);
                     }}/>
      <table>
        <tbody>
        {_.map(_.range(0, 8), pin =>
          <ConfigLine config={board.config} pin={pin} key={pin}/>
        )}
        </tbody>
      </table>
      <button onClick={() => board.config.save()}>Save config to board</button>
      <button onClick={() => board.settings.save()}>Save settings to board</button>
      <button onClick={() => board.setNewId(bid)}>Set new ID</button>
    </div>
});

const ControlPanel = observer(({board}) => {
  const {data, config} = board;

  return (data && config) ? <div className="board-control">
    {_.map(_.range(0, 8), pin =>
      config.isPinWrite(pin) ?
        <div onClick={() => data.togglePin(pin)} className='button-like'
             key={pin}>D{config.startingPin + pin} {data.isOn(pin) ? 'ON' : 'OFF'}</div> : void 0
    )}
    {_.map(_.range(0, 8), pin => data.isReadOn(pin) ? 'D' + (config.startingPin + pin) + ' is ON' : '.').join('')}
  </div> : <Loader/>
});

const Board = observer(({board}) => {
  return !board ? <Loader/> :
    <div className="board">
      <h3>Board #{board.bid}</h3>
      {board.status.lastError ? <pre>ERR: {board.status.lastError}</pre> : ''}
      <Configurator board={board}/>
      <ControlPanel board={board}/>
    </div>
})

const Boards = observer(() => {
  const appState = useContext(AppStateContext);

  return <div id="boards">{
    entries(appState.boards).map(([bid, board]) => <Board board={board} key={bid}/>)
  }
  </div>
})

export {Board, Boards}

