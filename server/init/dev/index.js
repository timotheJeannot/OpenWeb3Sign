const db = require("../../models");
const bcrypt = require("bcryptjs");

const initDataDev = async () =>  {
    //ici créer des utilisateurs pour ne pas avoir à faire l'inscription à chaque fois
    // et lancer l'environnement de developpement du réseau hedera
    // et mettre les données fictives dans cette ce réseau aussi

    await db.user.create({
        firstName : "Timothé",
        lastName : "Jeannot",
        email : "timothe.jeannot@gmail.com",
        birthday : "21/08/1996",
        password : bcrypt.hashSync("Sochalien25*",8)
    }).catch(err => {
        console.log(err);
    });
}

module.exports = initDataDev