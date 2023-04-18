import React from "react";
import { Container, Nav, NavDropdown, Navbar } from "react-bootstrap";

const NavigationBar = () => {

    return <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
            <Navbar.Brand href="/">Accueil</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link href="/sign_up">Inscription</Nav.Link>
                    <Nav.Link href="/log_in">Connexion</Nav.Link>
                    <Nav.Link href="/search">Recherche signataire</Nav.Link>
                    <Nav.Link href="/api">API</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Container>
    </Navbar>

};

export default NavigationBar;