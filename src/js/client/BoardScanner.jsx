import * as React from 'react';
import {useContext, useState} from 'react';
import {observer} from 'mobx-react'
import {AppStateContext} from './AppState';

const BoardScanner = observer(() => {
  const appState = useContext(AppStateContext);
 // const [boards, setBoards] = useState(appState.getBoardsList());

  return <div id="board-scanner">
    <h3>Scanner</h3>
    <div>
      <input value={appState.scanner.from} onChange={e => appState.scanner.setFrom(e.target.value)}/>-
      <input value={appState.scanner.to} onChange={e => appState.scanner.setTo(e.target.value)}/>
      <div>{appState.scanner.scanning ? 'Scanning now: ' : 'Next scan id='}{ appState.scanner.next } </div>
      <button onClick={() => {
        appState.scanner.toggleScanning();
      }}>{appState.scanner.scanning ? 'Stop' : 'Go'}</button>
      <button onClick={() => {
        appState.scanner.setList([]);
      }}>Reset</button>
      <input value={appState.scanner.list.join(",")} onBlur={e => appState.setBoardsList(e.target.value.split(","))}/>
      {appState.scanner.list.length ? 
      <button onClick={() => appState.setBoardsList(appState.scanner.list.join(","))}>
        Apply [{appState.scanner.list.join(",")}]
        </button>: null}
    </div>
  </div>
})

export {BoardScanner}

