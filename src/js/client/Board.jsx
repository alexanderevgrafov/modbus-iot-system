import * as React from 'react';
import { useState, useEffect, useReducer } from 'react';
import { useIO, useLink, useBoundLink, Link } from "valuelink";
import { BoardConfigModel, BoardDataModel } from "./BoardModel";
import { observer } from "mobx-react" // Or "mobx-react".
import { observable } from 'mobx';
import { AppState } from "./AppState";

//const STARTING_DIGITAL_PIN = 5;

const ConfigLine = observer(({ config }) => <tr>
    <td onClick={() => config.setRead(!config.read)} >D{config.pin}{config.read && '#'}</td>
    <td><input onChange={e => config.setAddr(e.target.value)} value={config.addr} /></td>
    <td onClick={() => config.setWrite(!config.write)} >D{config.pin}{config.write && '#'}</td>
</tr>
);

const Configurator = observer(({ config }) => {
    return <>
        { !config ? "Configurator will be here" :
            <>
                <table>
                    <tbody>
                        {_.map(_.range(0, 8), pin =>
                            <ConfigLine config={config.pins[pin]} key={pin} />
                        )}
                    </tbody>
                </table>
                <button onClick={() => config.save()}>Save config to board</button>
            </>
        }
    </>
});

const ControlPanelButtons = observer(({ data }) => {
    return <div>
        {_.map(_.range(0, 8), pin =>
            <button onClick={() => data.togglePin(pin)} key={pin} >Pin {pin} {data.pins[pin] ? 'ON' : 'OFF'}</button>
        )}
    </div>
});


const ControlPanel = observer(({ data }) => {
    return <>
        { !data ? "Control panel be here" : <ControlPanelButtons data={data} />}
    </>
});

const Board = observer(({ board }) => {
    useEffect(() => {
        if (board) {
            board.loadConfig();
            board.loadData();
        }
        return () => {
            // Remove Board Model into storage
        }
    }, [board]);
    return board ? <div>
        <h3>Board #{board.bid}</h3>
        <Configurator config={board.config} />
        <ControlPanel data={board.data} />
    </div> : "---"
})

export { Board }

