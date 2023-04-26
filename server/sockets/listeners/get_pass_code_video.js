module.exports = (socket) => {
    socket.on("get pass code video", (callback) => {
        // génération d'un code à quatre chiffres pour la vidéo
        // voir Video Biometric Verification dans le prochain lien
        //https://developer.idanalyzer.com/coreapi_reference.html
        let response = {};
        response.data = {};
        response.data.firstDigit = Math.floor(Math.random() * 10);
        response.data.secondDigit = Math.floor(Math.random() * 10);
        response.data.thirdDigit = Math.floor(Math.random() * 10);
        response.data.fourthDigit = Math.floor(Math.random() * 10);

        socket.passcodeIDAnalyser = response.data.firstDigit * 1000 + response.data.secondDigit * 100 + response.data.thirdDigit * 10 + response.data.fourthDigit;

        response.codeRet = 1;
        callback(response);
    });
}