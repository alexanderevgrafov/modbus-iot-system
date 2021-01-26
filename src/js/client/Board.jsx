import * as React from 'react';
import {useEffect} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".
import {appState} from './AppState';

const ConfigLine = observer(({config, startingPin}) => <tr>
  <td onClick={() => config.setRead(!config.read)}>D{startingPin + config.pin}{config.read && '#'}</td>
  <td><input onChange={e => config.setAddr(e.target.value)}
             value={config.addr ? startingPin + config.pin + config.addr : 0}/></td>
  <td onClick={() => config.setWrite(!config.write)}>D{startingPin + config.pin}{config.write && '#'}</td>
</tr>);

const Configurator = observer(({config}) => {
  return <>
    {!config ? 'Configurator will be here' :
      <>
        ID: <input value={config.boardId} onChange={e => config.setNewId(e.target.value)}/>
        StPin: <input value={config.startingPin} onChange={e => config.setNewStPin(e.target.value)}/>
        <table>
          <tbody>
          {_.map(_.range(0, 8), pin =>
            <ConfigLine config={config.pins[pin]} startingPin={config.startingPin} key={pin}/>
          )}
          </tbody>
        </table>
        {
          config.loaded ? <button onClick={() => config.update()}>Save config to board</button>
            : <button onClick={() => config._parent.fetchConfig(config.boardId)}>Load config</button>
        }
      </>
    }
  </>
});

const ControlPanel = observer(({data, config}) => {
  return <>
    {(data && config) ? <div>
      {_.map(_.range(0, 8), pin =>
        config.pins[pin].write ?
          <button onClick={() => data.togglePin(pin)}
                  key={pin}>D{config.startingPin + pin} {data.pins[pin] ? 'ON' : 'OFF'}</button> : void 0
      )}
    </div> : 'Control panel be here'}
  </>
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

  return !board ? '---' :
    <div>
      <h3>Board #{board.bid}</h3>
      {board.lastError ? <pre>{board.lastError}</pre> : ''}
      <Configurator config={board.config}/>
      <ControlPanel data={board.data} config={board.config}/>
    </div>
})

const Boards = observer(() => <>{
  _.map(_.keys(appState.boards), bid => <Board board={appState.getBoard(bid)} key={bid}/>)
}
</>)

export {Board, Boards}

