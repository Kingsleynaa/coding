import PropTypes from 'prop-types'
import { useEffect } from 'react';

// function Test({ name, age }) {
//     const array = [1, 2, 3, 4, 5];

//     for (const el of array) {
//         document.getElementById("div").innerHTML += `
//             <li></li>
//         `
//     }

//     return <div id="div"></div>
// }

import Alert from "./Alert";
function Upper() {
    function eventFired() {
        alert();
    }

    <Test onEvent={eventFired} />
}

function Test({ onEvent }) {
    // const array = [1, 2, 3, 4, 5];
    const [array, setArray] = useState([1, 2, 3, 4, 5]);
    setArray(array => [...array, 6, 7, 8, 9]);
    const [state, setState] = useState([1, 2, 3, 4, 5]);

    useEffect(() => {
        console.log(state);
    }, []);

    const content = array.map(e => <Alert />)

    return <div onClick={onEvent}>{content}</div>
}

export default Test