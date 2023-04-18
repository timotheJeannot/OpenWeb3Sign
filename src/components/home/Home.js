import React from "react";
import { Button } from "react-bootstrap";

const Home = () => {

    return <div>
        <h1 className="text-center"> Open web3 Sign</h1>
        <div className="p-3 bg-secondary">
            <div>Ici mettre les boutons principaux</div>
            <div className="d-flex justify-content-around">
                <Button variant="warning"> Rechercher un signataire</Button>
                <Button variant="warning"> Connexion ou Signer si connecté</Button>
            </div>
        </div>
        <div className="p-3 bg-info">
            Ici expliquer le principe de l'application
        </div>
        <div className="p-3 bg-secondary">
            Ici parler de l'open source et mettre un lien vers le github
        </div>
        <div className="p-3 bg-info">
            Ici parler de l'api et comment intégrer cette outil dans d'autres projets
        </div>
    </div>

};

export default Home;