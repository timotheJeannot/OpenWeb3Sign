import React from "react";
export default function OW3STimer(props) {
    const [timer, setTimer] = React.useState(props.time ? props.time : 14); //props.time must be in seconds
    const id = React.useRef(null);
    const clear = () => {
        window.clearInterval(id.current)
    }

    React.useEffect(() => {
        id.current = window.setInterval(() => {
            setTimer((time) => time - 1)
        }, 1000)
        return () => clear();
    }, [])

    React.useEffect(() => {
        if (timer === 0) {
            clear()
        }

    }, [timer])


    return (
        <div className={props.className? props.className : null}>Temps restant : {timer} </div>
    );
}