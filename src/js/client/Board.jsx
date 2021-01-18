import * as React from 'react';
import { useEffect } from 'react';
import { observer } from "mobx-react" // Or "mobx-react".

//const STARTING_DIGITAL_PIN = 5;

const ConfigLine = observer(({ config }) => <tr>
    <td onClick={() => config.setRead(!config.read)} >D{config.pin + 1}{config.read && '#'}</td>
    <td><input onChange={e => config.setAddr(e.target.value)} value={config.addr ? config.pin + config.addr + 1 : 0} /></td>
    <td onClick={() => config.setWrite(!config.write)} >D{config.pin + 1}{config.write && '#'}</td>
</tr>);

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
                <button onClick={() => config.update()}>Save config to board</button>
            </>
        }
    </>
});

const ControlPanel = observer(({ data, config }) => {
    return <>
        { (data && config) ? <div>
            {_.map(_.range(0, 8), pin =>
            config.pins[pin].write ?
                <button onClick={() => data.togglePin(pin)} key={pin} >D{pin + 1} {data.pins[pin] ? 'ON' : 'OFF'}</button> : void 0
            )}
        </div> : "Control panel be here"}
    </>
});

const Board = observer(({ board }) => {
    let pollInterval;

    useEffect(() => {
        if (board) {
            board.fetchConfig()
              .then(board.fetchData);
            pollInterval = setInterval( ()=>board.fetchData(), 4500);
        }

        return () => {
            // Remove Board Model into storage
            clearInterval(pollInterval);
        }
    }, [board]);

    return !board ?  "---" :
      <div>
        <h3>Board <input value={board.bid} onChange={e=>board.setNewId(e.target.value)}/></h3>
        <Configurator config={board.config} />
        <ControlPanel data={board.data}  config={board.config} />
    </div>
})

export { Board }

