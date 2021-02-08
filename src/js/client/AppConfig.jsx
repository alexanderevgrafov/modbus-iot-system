import * as React from 'react';
import {useState, useContext} from 'react';
import {observer} from 'mobx-react'
import {AppStateContext} from './AppState';
import {BoardScanner} from './BoardScanner';

const AppConfig = observer(() => {
  const appState = useContext(AppStateContext);
  const [boards, setBoards] = useState(appState.getBoardsList());

  return <div id="app-config">
    <h3>Config</h3>
    <div>
      <select onChange={e => appState.setPort(e.target.value)} defaultValue={appState.comPort}>
        <option value=''>--not set--</option>
        {
          _.map(appState.allPorts, port =>
            <option value={port.path}
                    key={port.path}>{port.path} {port.manufacturer ? '(' + port.manufacturer + ')' : ''}</option>)
        }
      </select>
    </div>
    <b>Last 10 errors: <button onClick={()=>appState.clearErrors()}>clear</button></b>
    {
      _.map(appState.errors, (err, i) => <li key={i}>{err}</li>)
    }
    <BoardScanner/>
  </div>
})

export {AppConfig}

