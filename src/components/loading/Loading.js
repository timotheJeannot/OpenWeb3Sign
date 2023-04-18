import React from "react";
import { Spinner } from "react-bootstrap";

const Loading = (props) => {

    return (
        <h1>Loading <Spinner
            as="span"
            animation="grow"
            size="sm"
            role="status"
            aria-hidden="true"
        />
        </h1>
    )
}

export default Loading;