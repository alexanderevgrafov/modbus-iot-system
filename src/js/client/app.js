import * as React from 'react';
import { useState } from 'react';
import * as ReactDOM from 'react-dom';


const Application = () => {
    const [state, setTest] = useState('--initial--')
    return <>
        <h1>{state}</h1>
        <button onClick={
            () => fetch('/test')
                .then(res => res.json())
                .then(data =>{ 
                    setTest(data.hellow)
                })
        }>Test API</button>
    </>
}

ReactDOM.render(
    <Application />,
    document.getElementById('root')
);