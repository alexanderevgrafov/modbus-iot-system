import * as React from 'react';
import {useState, useContext, useEffect} from 'react';
import {AppStateContext} from './models/AppState';
import {PluginConfig} from './PluginsConfig';
import {serverErrorCatch} from './Utils';

const pluginListApiPoint = '/plugin/list';

const PluginsList = () => {
  const appState = useContext(AppStateContext);
  const [list, setList] = useState([]);
  const [editedPlug, setEdited] = useState()
  const saveList = () =>
    fetch(pluginListApiPoint, {method: 'post', body: JSON.stringify({list: _.mapValues(list, 'isActive')})})
      .then(res => res.json())
      .then(serverErrorCatch)
      .catch(appState.setErrorItem);
  const togglePlug = (name, state) => {
    list[name].isActive = state;
    setList(list);
    saveList();
  }

  useEffect(() => {
    fetch(pluginListApiPoint)
      .then(res => res.json())
      .then(serverErrorCatch)
      .then(data => setList(data.data))
      .catch(appState.setErrorItem)
  }, []);

  return <div>
    {editedPlug && <><PluginConfig name={editedPlug}/><a onClick={() => setEdited()}>close</a></>}
    {_.map(list, (plug, name) => <li key={name}>
      {name} {plug.title} <input type='checkbox'
                                 onChange={e => togglePlug(name, e.target.checked)}
                                 defaultChecked={plug.isActive}/>
      <a onClick={() => setEdited(name)}>config</a>
    </li>)}
   {/* <button onClick={() => saveList()}>Save</button>*/}
  </div>;
}

export {PluginsList}
