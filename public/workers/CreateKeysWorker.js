const scriptUrl = new URL('/libs/forge.min.js', self.location.origin).toString();
self.window = self;
self.importScripts(scriptUrl);
const { pki, md } = self.forge;


self.addEventListener('message', (event) => {

    // Insérez ici votre code de génération de clés RSA
    // Par exemple, en utilisant la bibliothèque 'node-forge' ou 'crypto-browserify'

    const keyPair = pki.rsa.generateKeyPair(2048);
    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;

    const csr = pki.createCertificationRequest();
    csr.publicKey = publicKey;
    csr.setSubject([
        { name: 'commonName', value: 'example.com' },
        { name: 'countryName', value: 'FR' },
        { name: 'stateOrProvinceName', value: 'Some-State' },
        { name: 'localityName', value: 'Paris' },
        { name: 'organizationName', value: 'MyOrg' },
    ]);

    const sha256 = md.sha256.create();
    csr.sign(privateKey, sha256);

    const csrPem = pki.certificationRequestToPem(csr);

    const publicKeyPem = pki.publicKeyToPem(publicKey);
    const privateKeyPem = pki.privateKeyToPem(privateKey);

    self.postMessage({ publicKeyPem: publicKeyPem, privateKeyPem: privateKeyPem, csrPem : csrPem });
});