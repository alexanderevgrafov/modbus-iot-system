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

const Input = ({data: {name, label, state}}) => {
  const appState = useContext(AppStateContext);

  return <>
    { label }: <input
    defaultValue={ state.value }
    onChange={ e => appState.onLayoutControlChange( name, { value : e.target.value } ) }
  />
  </>
};

export {Button, Info, Input};
