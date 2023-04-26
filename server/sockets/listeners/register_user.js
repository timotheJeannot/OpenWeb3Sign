module.exports = (socket) => {
    socket.on("register user", (data, callback) => {

        callback({codeRet:1 , data : null});

    });
}