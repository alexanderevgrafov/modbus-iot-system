import * as React from 'react';
import {useContext} from 'react';
import {observer} from 'mobx-react'
import {AppStateContext} from './AppState';

const BoardScanner = observer(() => {
  const appState = useContext(AppStateContext);

  return <div id="board-scanner">
    <h3>Scanner</h3>
    <div>
      <input value={appState.scanner.from} onChange={e => appState.scanner.setFrom(e.target.value)}/>-
      <input value={appState.scanner.to} onChange={e => appState.scanner.setTo(e.target.value)}/>
      <button onClick={() => {
        appState.scanner.toggleScanning();
      }}>{appState.scanner.scanning ? 'Stop' : 'Go'}</button>
      <button onClick={() => {
        appState.scanner.setList([]);
      }}>Reset</button>
    </div>
  </div>
})

export {BoardScanner}

