import React, { useContext } from "react";
import { Container, Nav, NavDropdown, Navbar } from "react-bootstrap";
import { UserContext } from "../../context/user";

const NavigationBar = () => {

    const currentUser = useContext(UserContext);

    const logout = () => {
        localStorage.removeItem("user");
    }

    const render = () => {
        if (!currentUser) {
            return <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand href="/">Accueil</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="/sign_up">Inscription</Nav.Link>
                            <Nav.Link href="/sign_in">Connexion</Nav.Link>
                            <Nav.Link href="/search">Recherche signataire</Nav.Link>
                            <Nav.Link href="/api">API</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        }

        return <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand href="/profile">Profil</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/sign_document">Signer un document</Nav.Link>
                        <Nav.Link href="/create_signature">Créer une signature</Nav.Link>
                        <Nav.Link href="/search">Recherche signataire</Nav.Link>
                        <Nav.Link href="/api">API</Nav.Link>
                    </Nav>
                    <Nav>
                        <Nav.Link href="/" onClick={logout}>Déconnexion</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    }

    return render();

};

export default NavigationBar;