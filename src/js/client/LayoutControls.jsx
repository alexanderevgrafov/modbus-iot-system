import * as React from 'react';
import {useContext} from 'react';
import {AppStateContext} from './models/AppState';

const Button = ({data: {name, label, state}}) => {
  const appState = useContext(AppStateContext);

  return <button
    onClick={() => appState.onLayoutControlChange(name, {value: !state.value})}
  >{label || 'Untitled'} {state.value ? 'ON' : 'off'}
  </button>
};

const Info = ({data: {label, state}}) => <div>{label}: {state.status}</div>;


export {Button, Info};
