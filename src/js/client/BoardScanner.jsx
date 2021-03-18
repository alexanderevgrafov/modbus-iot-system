import * as React from 'react';
import {useContext, useState} from 'react';
import {observer} from 'mobx-react'
import {AppStateContext} from './models/AppState';

const BoardScanner = observer(() => {
  const appState = useContext(AppStateContext);
  const [idToAdd, setIdToAdd] = useState('');

  return <div id="board-scanner">
    <div className='section-title'>Scanner</div>
    <div>
      <input value={appState.scanner.from} onChange={e => appState.scanner.setFrom(e.target.value)}/>-
      <input value={appState.scanner.to} onChange={e => appState.scanner.setTo(e.target.value)}/>
      <div>{appState.scanner.scanning ? 'Scanning now: ' : 'Next scan id='}{appState.scanner.next} </div>
      <button onClick={() => appState.scanner.toggleScanning()}>{appState.scanner.scanning ? 'Stop' : 'Go'}</button>
      <button onClick={() => appState.scanner.resetScan()}>Reset</button>
      [{appState.scanner.list.join(',')}]
      {/*    <input value={appState.scanner.list.join(",")} onBlur={e => appState.setBoardsList(e.target.value.split(","))}/>
      {appState.scanner.list.length ?
      <button onClick={() => appState.setBoardsList(appState.scanner.list.join(","))}>
        Apply [{appState.scanner.list.join(",")}]
        </button>: null}*/}
      <h4>Manual List Set:</h4>
      <input value={idToAdd} onChange={e => setIdToAdd(e.target.value)}/>
      <button onClick={() => appState.scanner.manualAddBoard(idToAdd)}> Manual Add</button>
    </div>
  </div>
})

export {BoardScanner}

