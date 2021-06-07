import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {AppStateContext, AppState} from './models/AppState';
import {Loader} from './Loader';
import {AppConfig} from './AppConfig';
import {Boards} from './Board'
import {Layout} from './Layout'
import {useState, useEffect, useContext} from 'react';
import {observer} from 'mobx-react' // Or "mobx-react".
import {io} from 'socket.io-client';
import {applySnapshot, getSnapshot} from 'mobx-state-tree';
import './styles.less';

const socketServerPath = process.env.WS_SERVER_HOST + ':' + process.env.WS_SERVER_PORT;
const socket = io(socketServerPath);

console.log('WS server path used', socketServerPath);

// const onWindowOrTabClose = appState => async e => {
//   console.log('unmounting...');
//   console.log('done!.');
// };

const onWindowFocusFactory = appState => async e => {
  console.log('### window is focused! (state load)');
  appState.load();
};

const Application = observer(() => {
  const [ready, setReady] = useState(false);
  const [appState] = useState(AppState.create({scanner: {}}));

  useEffect(() => {
    const onWindowFocus = onWindowFocusFactory(appState);

    appState.load()
      .then(() => {
        setReady(true)
      })

    socket.on('boardSet', payload => {
      const {bid, data} = payload;
      try {
        const board = appState.getBoard(bid);
        const snap = _.defaultsDeep(data, getSnapshot(board));

        applySnapshot(board, snap);
      } catch (e) {

      }
    });

    socket.on('stateReload', () => {
      appState.load();
    });

    socket.on('lc', payload => {
      appState.updateLayout(payload);
    });

    window.addEventListener('focus', onWindowFocus);

    return () => {
      window.removeEventListener('focus', onWindowFocus);
    }
  }, []);

  return <>
    <AppStateContext.Provider value={appState}>
      {!ready ? <Loader/> :
        <div id="app-wrapper">
          <AppConfig/>
          <Layout layout={appState.layout}/>
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
