module.exports = (socket, io) => {
    socket.on("send video to original device", (data, callback) => {

        console.log("test data and callback");
        console.log(data);
        console.log(callback);
        let socketOriginalDevice = io.sockets.sockets.get(data.socketIdOriginalDevice);
        let bufferVideo = data?.blob;
        if (socketOriginalDevice && bufferVideo) {
            socketOriginalDevice.emit("buffer video register user", bufferVideo);
            callback({ codeRet: 1, data: null });
            return;
        }

        callback({codeRet : -1, error: "errors parameters"});

    });
}