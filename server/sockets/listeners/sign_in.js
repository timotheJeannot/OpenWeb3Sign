const db = require("../../models");
const bcrypt = require("bcryptjs");
const config = require("../../config/auth.config");
const jwt = require("jsonwebtoken");


module.exports = (socket) => {
    socket.on("sign in", async (data, callback) => {

        // ici il faut vérifier plus en détails les données que le serveur reçoit
        if (!data) {
            callback({ codeRet: -1, error: "data is missing" });
            return;
        }

        const userFound = await db.user.findOne({
            where: {
                email: data.email
            }
        });

        if (!userFound) {
            callback({ codeRet: -2, error: "There is no user registered with this email" });
            return;
        }

        let testPassword = bcrypt.compareSync(data.password, userFound.password);

        if (!testPassword) {
            callback({ codeRet: -2, error: "error password" });
            return;
        }

        const token = jwt.sign({ id: userFound.id }, config.secret, {
            expiresIn: 86400 // 24 hours
        });

        const dataToSend = {
            accessToken: token,
            id: userFound.id,
            firstName : userFound.firstName,
            lastName : userFound.lastName,
            email : userFound.email,
            birthday : userFound.birthday
        }

        callback({ codeRet: 1, data: dataToSend });

    });
}