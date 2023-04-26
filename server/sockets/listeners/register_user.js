const db = require("../../models");
const bcrypt = require("bcryptjs");

module.exports = (socket) => {
    socket.on("register user", async(data, callback) => {

        // ici il faut vérifier plus en détails les données que le serveur reçoit
        if(!data){
            callback({codeRet:-1 , error : "data is missing"});
            return;
        }

        const userFound = await db.user.findOne({
            where : {
                email : data.email
                // vérifier aussi l'identité (un utilisateur ne doit pas avoir 2 comptes ?)
            }
        });

        if(userFound){
            callback({codeRet:-2 , error : "this email is already used"});
            return;
        }

        let testErr = null;
        await db.user.create({
            firstName : "first name random "+Math.random(),
            lastName : "last name random "+Math.random(),
            email : data.email,
            birthday : "birthday random " +Math.random(),
            password : bcrypt.hashSync(data.password,8)
        }).catch(err => {
            testErr = err;
        });

        if(testErr){
            callback({codeRet:-2 , error : testErr}); 
        }



        callback({codeRet:1 , data : null});

    });
}