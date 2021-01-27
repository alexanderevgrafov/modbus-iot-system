import * as React from 'react';
import {useEffect, useContext} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".
import { getParent} from 'mobx-state-tree'
import {Loader} from './Loader'
import {AppStateContext} from './AppState';

const ConfigLine = observer(({config, startingPin}) => <tr>
  <td onClick={() => config.setRead(!config.read)}>D{startingPin + config.pin}{config.read && '#'}</td>
  <td><input onChange={e => config.setAddr(e.target.value)}
             value={config.addr ? startingPin + config.pin + config.addr : 0}/></td>
  <td onClick={() => config.setWrite(!config.write)}>D{startingPin + config.pin}{config.write && '#'}</td>
</tr>);

const Configurator = observer(({config}) => {
  const [bid, setBid] = useState(config.boardId);
  const [period, setPeriod] = useState(config.refreshPeriod);
  let debId, debPer;
  useEffect(()=>{
    debId = _.debounce(val=>config.setNewId(val), 500);
    debPer = _.debounce(val=>config.setPeriod(val), 500);
  }, [config])
  return !config ? 'Configurator will be here' :
    <div className="board-config">
      ID: <input value={bid} onChange={e => {const val = e.target.value; setBid(val); debId(val);}}/>
      StPin: <input value={config.startingPin} onChange={e => config.setNewStPin(e.target.value)}/>
      RefPer: <input value={period} onChange={e => {const val = e.target.value; setPeriod(val); debPer(val);}}/>
      <table>
        <tbody>
        {_.map(_.range(0, 8), pin =>
          <ConfigLine config={config.pins[pin]} startingPin={config.startingPin} key={pin}/>
        )}
        </tbody>
      </table>
      {
        config.loaded ? <button onClick={() => config.update()}>Save config to board</button>
          : <button onClick={() => getParent(config).fetchConfig(config.boardId)}>Load config</button>
      }
    </div>
});

const ControlPanel = observer(({data, config}) => {
  return (data && config) ? <div className="board-control">
    {_.map(_.range(0, 8), pin =>
      config.pins[pin].write ?
        <button onClick={() => data.togglePin(pin)}
                key={pin}>D{config.startingPin + pin} {data.pins[pin] ? 'ON' : 'OFF'}</button> : void 0
    )}
  </div> : <Loader/>
});

const Board = observer(({board}) => {
  let pollInterval;

  useEffect(() => {
    if (board) {
      board.fetchConfig()
        .then(() => board.fetchData());
      pollInterval = setInterval(() => board.fetchData(), 9000);
    }

    return () => {
      // Remove Board Model into storage
      clearInterval(pollInterval);
    }
  }, [board]);

  return !board ? <Loader/> :
    <div className="board">
      <h3>Board #{board.bid}</h3>
      {board.lastError ? <pre>ERR: {board.lastError}</pre> : ''}
      <Configurator config={board.config}/>
      <ControlPanel data={board.data} config={board.config}/>
    </div>
})

const Boards = observer(() => {
  const appState = useContext(AppStateContext);

  return <div id="boards">{
    _.map(appState.boards, board => <Board board={board} key={board.bid}/>)
  }
  </div>
})

export {Board, Boards}

