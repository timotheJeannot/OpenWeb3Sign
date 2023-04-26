const getPassCodeVideo = (socket) => {
    return new Promise((resolve, reject) => {
        socket.emit("get pass code video", (response) => {
            if (response.codeRet > 0) {
                resolve(response.data);
            } else {
                reject(response.error);
            }
        });
    });
};

const sendVideoToOriginalDevice = (socket,data) => {
    return new Promise((resolve, reject) => {
        socket.emit("send video to original device", data, (response) => {
            if (response.codeRet > 0) {
                resolve(response.data);
            } else {
                reject(response.error);
            }
        });
    });
};

const registerUser = (socket,data) => {
    return new Promise((resolve, reject) => {
        socket.emit("register user", data, (response) => {
            if (response.codeRet > 0) {
                resolve(response.data);
            } else {
                reject(response.error);
            }
        });
    });
};

module.exports = {
    getPassCodeVideo,
    sendVideoToOriginalDevice,
    registerUser
}