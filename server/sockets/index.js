const onGetPassCodeVideo =  require("./listeners/get_pass_code_video");
const onSendVideoToOriginalDevice = require("./listeners/send_video_to_original_device");
const onRegisterUSer = require("./listeners/register_user");

function onNewSocketConnexion (socket,io) {
    console.info(`Socket ${socket.id} has connected.`);

    onGetPassCodeVideo(socket);

    onSendVideoToOriginalDevice(socket,io);

    onRegisterUSer(socket);
};

function socketConnection(io) {
    io.on("connection",(socket) => onNewSocketConnexion(socket,io))
};

module.exports={
    socketConnection
}