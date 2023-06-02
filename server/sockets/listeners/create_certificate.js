const forge = require('node-forge');
const {serverPrivateKeyPem} = require("../../config/certificate.config");
const db = require("../../models");

module.exports = (socket) => {
    socket.on("send csr", async (data, callback) => {

        // ici il faut vérifier plus en détails les données que le serveur reçoit
        if (!data) {
            callback({ codeRet: -1, error: "data is missing" });
            return;
        }

        const csr = forge.pki.certificationRequestFromPem(data);

        // Vérifier les informations de la CSR
        if (!csr.verify()) {
            callback({ codeRet: -2, error: "Invalid CSR" });
            return;
        }

        if(!socket.userId){
            callback({ codeRet: -3, error: "unauthenticated user" });
            return;
        }

        // Générer un certificat signé
        const cert = forge.pki.createCertificate();
        const randomSerialNumber = forge.util.bytesToHex(forge.random.getBytesSync(20));
        cert.serialNumber = randomSerialNumber
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        cert.setSubject(csr.subject.attributes);
        cert.setIssuer([{ name: 'commonName', value: 'example.com' }]);
        cert.setExtensions([{ name: 'basicConstraints', cA: false }]);
        cert.publicKey = csr.publicKey;

        // Signer le certificat avec la clé privée du serveur
        const serverPrivateKey = forge.pki.privateKeyFromPem(serverPrivateKeyPem);
        cert.sign(serverPrivateKey, forge.md.sha256.create());

        const certificate = forge.pki.certificateToPem(cert);

        let publicKey = forge.pki.publicKeyToPem(cert.publicKey);

        let testErr = null;

        let nbKeys = await db.key.count({
            where : {
                userId : socket.userId
            }
        });

        if(nbKeys > 100){
            callback({ codeRet: -3, error: "you can't have more than 100 keys" });
            return;
        }

        await db.key.create({
            userId : socket.userId,
            publicKey : publicKey,
            certificate : certificate,
            method : "RSA"
        }).catch(err => {
            testErr = err;
        });

        if(testErr){
            callback({ codeRet: -4, error: testErr });
            return;
        }

        callback({ codeRet: 1, data: certificate });

    });
}