import * as React from 'react';
import { observer } from "mobx-react"
import {appState} from './AppState';

const AppConfig = observer(() => <div>
  <h3>Config</h3>
  <select onChange={e=>appState.setPort(e.target.value)}>{
    _.map(_.keys(appState.allPorts), port =>
      <option value={port.path} key={port.path} selected={ port.path===appState.port}>{ port.path } ({port.manufacturer})</option>)
  }
  </select>
</div>)

export { AppConfig }

