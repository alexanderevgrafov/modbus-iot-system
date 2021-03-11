import * as React from 'react';
import {observer} from 'mobx-react';
import {entries} from 'mobx';
import {Button, Info} from './LayoutControls';

const controlsMap = {
  button: Button,
  information: Info,
}

const LayoutControl = observer(({control: {type, ...data}}) => {

  const Control = controlsMap[type];
  if (!Control) {

    console.log(`No control created for [${type}]`);

    return `[unsupported ${type}]`;
  }

  return <Control data={data}/>
});

const Layout = observer(({layout}) => <>{
  entries(layout).map(([name, control]) => {

    return <LayoutControl control={control} name={name} key={name}/>
  })
}</>);

export {Layout}
