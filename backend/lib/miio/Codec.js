const createMiioHeader = require("./MiioHeader");

const crypto = require("crypto");
const Logger = require("../Logger");

class Codec {
    /**
     * @param {object} options
     * @param {Buffer} options.token
     */
    constructor(options) {
        this.setToken(options.token);
    }

    /**
     * @param {Buffer} token
     */
    setToken(token) {
        this.token = token;
        this.tokenKey = crypto.createHash("md5").update(this.token).digest();
        this.tokenIV = crypto.createHash("md5").update(this.tokenKey).update(this.token).digest();
    }

    /**
     * @param {Buffer} response
     */
    handleResponse(response) {
        const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16);
        response.copy(header, 0,0,32);

        const encrypted = response.slice(32);
        const stamp = header.readUInt32BE(12);

        const digest = crypto.createHash("md5")
            .update(header.slice(0, 16))
            .update(this.token)
            .update(encrypted)
            .digest();

        const checksum = header.slice(16);
        let token = null;
        let msg = null;
        if (!checksum.equals(digest)) {
            if (encrypted.length > 0) {
                Logger.error("Invalid checksum:", {checksum, expected: digest, packet: response, token: this.token});
            } else {
                // If we receive an empty packet with a wrong checksum, assume that we're getting
                // a new token.
                token = Buffer.from(header.slice(16));
            }
        } else if (encrypted.length > 0) {
            const decipher = crypto.createDecipheriv("aes-128-cbc", this.tokenKey, this.tokenIV);
            let decrypted = null;
            try {
                decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                // eslint-disable-next-line no-control-regex
                let jsonString = decrypted.toString().replace(/[\u0000-\u0019]+/g, "");
                try {
                    msg = JSON.parse(jsonString);
                } catch (e) {
                    // Sometimes remote sends invalid json objects with trailing characters.
                    // Try again with shorter strings.
                    while (jsonString.length) {
                        try {
                            msg = JSON.parse(jsonString);
                            break;
                        } catch (e) {
                            jsonString = jsonString.substr(0, jsonString.length - 1);
                        }
                    }
                    if (msg === null) {
                        throw e;
                    }
                }
            } catch (e) {
                Logger.error("Error decrypting/parsing: ", e, msg, decrypted);
            }
        }
        return {
            stamp: stamp,
            deviceId: header.readUInt32BE(8),
            msg: msg,
            token: token
        };
    }

    /**
     * @param {Buffer?} msg
     * @param {import("./Stamp")} stamp
     * @param {number} deviceId
     */
    encode(msg, stamp, deviceId) {
        const cipher = crypto.createCipheriv("aes-128-cbc", this.tokenKey, this.tokenIV);
        const encrypted = msg === null ? Buffer.alloc(0) : Buffer.concat([cipher.update(msg), cipher.final()]);
        const secondsPassed = Math.max(0, Math.floor((Date.now() - stamp.time) / 1000));

        const header = createMiioHeader({
            timestamp: stamp.val + secondsPassed,
            deviceId: deviceId,
            payloadLength: encrypted.length,
            unknown: 0
        });

        //checksum
        const digest = crypto.createHash("md5")
            .update(header.slice(0, 16))
            .update(this.token)
            .update(encrypted)
            .digest();

        digest.copy(header, 16);
        return Buffer.concat([header, encrypted]);
    }
}

module.exports = Codec;
