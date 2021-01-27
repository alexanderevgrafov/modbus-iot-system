import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {AppStateContext, AppState} from './AppState';
import {Loader} from './Loader';
import {AppConfig} from './AppConfig';
import {Boards} from './Board'
import {useState, useEffect, useContext} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".

import "./styles.less";

const onWindowOrTabClose = async e => {
  console.log('unmounting...');
 await appState.save();
  console.log('done!.');
};

const Application = observer(() => {
  const [ready, setReady] = useState(false);
  const [appState] = useState(AppState.create());

  useEffect(() => {
    // appState.save();
    appState.load()
      .then(() => {
        setReady(true)
      })

    window.addEventListener('beforeunload', onWindowOrTabClose);

    return () => {
      window.removeEventListener('beforeunload', onWindowOrTabClose);
    }
  }, []);

  return <>
    <AppStateContext.Provider value={appState}>
    {!ready ? <Loader/> :
      <div id="app-wrapper">
        <AppConfig/>
        <Boards/>
      </div>
    }
    </AppStateContext.Provider>
  </>
})

ReactDOM.render(
  <Application/>,
  document.getElementById('root')
);
