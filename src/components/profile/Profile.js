import React, { useContext} from "react";
import Loading from "../loading/Loading";
import { UserContext } from "../../context/user";

const Profile = () => {

    const currentUser = useContext(UserContext);

    const render = () => {

        if(!currentUser){
            return <Loading />
        }

        return <div>
        <p>bienvenue sur le profil de {currentUser.firstName} {currentUser.lastName}</p>
        <p>Il faut afficher les informations de l'utilisateur</p>
        <p>Et il faut voir si cela peut être intéressant d'afficher un historique des signatures</p>
        <p>
            On peut aussi afficher les contrats signées. Mais pour cela 
            il faut demander à l'utilisateur si il souhaite enregistrer le contrat dans notre bdd
            ou sur le réseau hedera
        </p>

        <p>
            Mais on peut au moins tenir un historique de toute les signatures.
            Cela veut dire que pour chaque signature il faut demander à l'utilisateur de créer
            un label pour cette signature. Et on peut afficher pour chaque signature, le label et la date
        </p>

        <p>Dans les informations de l'utilisateur, il faut aussi afficher les différentes clés publiques 
            (avec leurs méthode de chiffrement) associés à l'utilisateur</p>
    </div>
    }

    return render();
};

export default Profile;