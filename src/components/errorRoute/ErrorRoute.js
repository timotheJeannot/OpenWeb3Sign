import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";

const ErrorRoute = () => {

    return <Container className="mt-3">
        <h1>
            Erreur, ceci n'est pas une url valide sur ce site
        </h1>
    </Container>
}

export default ErrorRoute;