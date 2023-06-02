const config = require("../config/auth.config");
const jwt = require("jsonwebtoken");

const onGetPassCodeVideo = require("./listeners/get_pass_code_video");
const onSendVideoToOriginalDevice = require("./listeners/send_video_to_original_device");
const onRegisterUSer = require("./listeners/register_user");
const onSignIn = require("./listeners/sign_in");
const onCreateCertificate = require("./listeners/create_certificate");

function onNewSocketConnexion(socket, io) {
    console.info(`Socket ${socket.id} has connected.`);

    onGetPassCodeVideo(socket);

    onSendVideoToOriginalDevice(socket, io);

    onRegisterUSer(socket);

    onSignIn(socket);

    onCreateCertificate(socket);
};

function socketConnection(io) {
    io.use((socket, next) => {
        if (socket.handshake?.query?.token) {
            jwt.verify(socket.handshake?.query?.token, config.secret, async (err, decoded) => {
                // if (err) {
                //     return next(new Error('Authentication error'));
                // }
                if(!err){
                    socket.userId = decoded.id;
                }
            });
        }
        next();
    }).on("connection", (socket) => onNewSocketConnexion(socket, io))
};

module.exports = {
    socketConnection
}