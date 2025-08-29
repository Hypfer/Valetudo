const crypto = require("crypto");
const forge = require("node-forge");
const Logger = require("../Logger");

class DummyCloudCertManager {
    /**
     * @param {object} options
     * @param {forge.pki.PrivateKey} options.caKey
     * @param {forge.pki.Certificate} options.caCert
     */
    constructor(options) {
        this.caKey = options.caKey;
        this.caCert = options.caCert;
        this.certCache = new Map();
    }

    getCertificate(hostname) {
        if (this.certCache.has(hostname)) {
            const cachedEntry = this.certCache.get(hostname);

            if (cachedEntry) {
                if (cachedEntry.validUntil > new Date(Date.now() + 60000)) {
                    return cachedEntry;
                } else {
                    Logger.info(`Certificate for '${hostname}' has expired or is about to expire. Regenerating.`);
                }
            } else {
                Logger.info(`No cached certificate available for '${hostname}'.`);
            }

        }

        const newCertData = this.generateCertificate(hostname);

        this.certCache.set(hostname, newCertData);

        return newCertData;
    }

    generateCertificate(hostname) {
        Logger.info(`Generating new certificate for '${hostname}'.`);

        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();

        cert.publicKey = keys.publicKey;
        cert.serialNumber = "01" + crypto.randomBytes(19).toString("hex"); // rfc5280 4.1.2.2
        cert.validity.notBefore = new Date(new Date().setDate(new Date().getDate() - 1));
        cert.validity.notAfter = new Date(new Date().setFullYear(new Date().getFullYear() + 30)); // Midea doesn't handle the cert expiring gracefully or at all

        cert.setSubject([{ name: "commonName", value: hostname }]);
        cert.setIssuer(this.caCert.subject.attributes);
        cert.setExtensions([
            { name: "basicConstraints", cA: false },
            { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
            { name: "extKeyUsage", serverAuth: true },
            { name: "subjectAltName", altNames: [{ type: 2, value: hostname }] }
        ]);

        cert.sign(this.caKey, forge.md.sha256.create());

        return {
            key: forge.pki.privateKeyToPem(keys.privateKey),
            cert: forge.pki.certificateToPem(cert),
            validUntil: cert.validity.notAfter
        };
    }
}

module.exports = DummyCloudCertManager;
