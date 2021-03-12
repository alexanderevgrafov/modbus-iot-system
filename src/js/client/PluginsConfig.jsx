import * as React from 'react';
import {useState, useContext, useEffect} from 'react';
import * as Json5 from 'json5';
import {AppStateContext} from './models/AppState';
import {Loader} from './Loader';
import {serverErrorCatch} from './Utils';

const PluginConfig = ({name}) => {
  const pluginConfigApiPoint = `/plugin/${name}/config`;
  const appState = useContext(AppStateContext);
  const [saving, setSaving] = useState(false);
  const [json, setJson] = useState('');
  const [isValid, setValid] = useState(true);
  const doSave = () => {
    const body = JSON.stringify({config: json});
    setSaving(true);

    fetch(pluginConfigApiPoint, {method: 'post', body})
      .then(serverErrorCatch)
      .finally(() => setSaving(false))
      .catch(appState.setErrorItem)
  }
  const validateAndSetJson = json => {
    let isValid = true;

    if (json) {
      try {
        Json5.parse(json);
      } catch (e) {
        isValid = false;
      }
    }

    setValid(isValid);
    setJson(json);
  }

  useEffect(() => {
    fetch(pluginConfigApiPoint)
      .then(res => res.json())
      .then(serverErrorCatch)
      .then(data => {
        console.log('Conf loaded', data);
        validateAndSetJson(Json5.stringify(data.data, null, 2));
      })
      .catch(appState.setErrorItem)
  }, [name]);

  return <div>
    <textarea value={json} onChange={e => validateAndSetJson(e.target.value)}/>
    {!isValid && <span>[JSON is invalid]</span>}
    {saving ? <Loader/> : <button onClick={() => doSave()}>Save</button>}
  </div>;
}


export {PluginConfig}
