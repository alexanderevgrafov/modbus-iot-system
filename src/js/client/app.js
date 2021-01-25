import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Boards} from './Board';
import {appState} from './AppState';
import {AppConfig} from './AppConfig';
import {useState, useEffect, useReducer} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".
//import ControlPanel from "./ControlPanel";
//import {ApplicationState} from "./AppState";

const Application = observer(() => {
  // const [appState] = useState(new AppState);
  //const setColor = mask => fetch('/led?led=' + (state ^ mask)).then(() => setState(state ^ mask))
  //const [state, setState] = useState(null);
  const [ready, setReady] = useState(false)
  useEffect(() => {
    //  setState(new AppState);

    appState.load()
      .then(() => {
        setReady(true)
      })

    return () => {
      appState.save();
    }
  }, []);

  return <>
    {!ready ? '-[Loading..]-' :
      <>
        <AppConfig/>
        <Boards/>
      </>
    }
  </>
})

ReactDOM.render(
  <Application/>,
  document.getElementById('root')
);
