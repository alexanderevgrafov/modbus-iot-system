import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {appState} from './internal';
import {AppConfig} from './AppConfig';
import {Boards} from './Board'
import {useState, useEffect} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".

const Application = observer(() => {

  const [ready, setReady] = useState(false)
  useEffect(() => {
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
