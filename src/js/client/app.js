import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Board} from "./Board";
import {AppState} from "./AppState";
import { useState, useEffect, useReducer } from 'react';
import { observer } from "mobx-react" // Or "mobx-react".
//import ControlPanel from "./ControlPanel";
//import {ApplicationState} from "./AppState";

const Application = observer(() => {
   // const [appState] = useState(new AppState);
    //const setColor = mask => fetch('/led?led=' + (state ^ mask)).then(() => setState(state ^ mask))
    const [state, setState] = useState(null);
    useEffect(()=>{
        setState(new AppState);
        return ()=>{
            // Remove Board Model into storage
        }
    }, []);

    return <>
    { !state ? "---" : <Board board={state.getBoard(222)}/>  }
    </>
})

ReactDOM.render(
    <Application />,
    document.getElementById('root')
);