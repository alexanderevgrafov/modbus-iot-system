import * as React from 'react';
import {useContext} from 'react';
import {observer} from 'mobx-react'
import {AppStateContext} from './models/AppState';
import {BoardScanner} from './BoardScanner';
import * as dayjs from 'dayjs'
import {PluginsList} from './PluginsList';

const AppConfig = observer(() => {
  const appState = useContext(AppStateContext);

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
    <b>Last errors: <button onClick={()=>appState.clearErrors()}>clear</button></b>
    {
      _.map(appState.errors, (err, i) => <div key={i}>{dayjs(err.date).format('DD MMM HH:mm:ss')}: {err.text}</div>)   //DD MMM
    }
    <BoardScanner/>
    <PluginsList/>
  </div>
})

export {AppConfig}

