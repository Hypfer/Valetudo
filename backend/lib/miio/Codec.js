const crypto = require("crypto");

const createMiioHeader = require("./MiioHeader");
const DecodedMiioPacket = require("./DecodedMiioPacket");
const Logger = require("../Logger");
const Stamp = require("./Stamp");

class Codec {
    /**
     * @param {object} options
     * @param {Buffer} options.token
     */
    constructor(options) {
        this.setToken(options.token);

        this.stamp = new Stamp({});
    }

    /**
     * @param {Buffer} token
     */
    setToken(token) {
        this.token = token;

        this.tokenKey = crypto.createHash("md5").update(this.token).digest();
        this.tokenIV = crypto.createHash("md5").update(this.tokenKey).update(this.token).digest();
    }

    updateStamp(val) {
        this.stamp = new Stamp({val: val}).orNew();
    }

    /**
     * @param {Buffer} rawPacket
     * @returns {DecodedMiioPacket}
     */
    decodeIncomingMiioPacket(rawPacket) {
        /*
            See: https://github.com/OpenMiHome/mihome-binary-protocol/blob/master/doc/PROTOCOL.md

             2 byte Magic Number
             2 byte Packet Length
             4 byte Unknown1
             4 byte Device ID
             4 byte Stamp
            16 byte md5 checksum or token
         */
        const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16);
        rawPacket.copy(header, 0,0,32);

        const encryptedPayload = rawPacket.slice(32);
        const stamp = header.readUInt32BE(12);

        const calculatedChecksum = crypto.createHash("md5")
            .update(header.slice(0, 16))
            .update(this.token)
            .update(encryptedPayload)
            .digest();

        const checksumFromHeader = header.slice(16);
        let token = null;
        let msg = null;

        if (checksumFromHeader.equals(calculatedChecksum)) {
            if (encryptedPayload.length > 0) {
                const decipher = crypto.createDecipheriv("aes-128-cbc", this.tokenKey, this.tokenIV);
                let decryptedPayload = null;

                try {
                    decryptedPayload = Buffer.concat([decipher.update(encryptedPayload), decipher.final()]);

                    // Apparently most if not all(?) miio messages are stringified json terminated with a \0
                    if (decryptedPayload[decryptedPayload.length -1] === 0) {
                        decryptedPayload = decryptedPayload.slice(0, decryptedPayload.length -1);
                    }

                    msg = JSON.parse(decryptedPayload.toString());
                } catch (e) {
                    Logger.error("Error decrypting/parsing: ", e, msg, decryptedPayload);
                }
            }
        } else {
            if (encryptedPayload.length > 0) {
                //This should never happen
                Logger.error("Invalid checksum:", {
                    checksumFromHeader: checksumFromHeader,
                    calculatedChecksum: calculatedChecksum,
                    packet: rawPacket,
                    token: this.token
                });
            } else {
                // If we receive an empty packet with a wrong checksum, assume that we're instead being provided a new token.
                token = Buffer.from(header.slice(16));

                if (
                    token.toString("hex") !== "ffffffffffffffffffffffffffffffff" &&
                    token.toString("hex") !== "00000000000000000000000000000000" &&
                    !(this.token.equals(token))
                ) {
                    Logger.info("Got token from handshake:", token.toString("hex"));

                    this.setToken(token);
                }
            }
        }

        return new DecodedMiioPacket({
            stamp: stamp,
            deviceId: header.readUInt32BE(8),
            msg: msg,
            token: token
        });
    }

    /**
     * @param {any} payload
     * @param {number} deviceId
     * @returns {Buffer}
     */
    encodeOutgoingMiioPacket(payload, deviceId) {
        const stamp = this.stamp.orNew();
        let encryptedPayload;

        if (payload !== null) {
            const cipher = crypto.createCipheriv("aes-128-cbc", this.tokenKey, this.tokenIV);
            const payloadBuf = Buffer.from(JSON.stringify(payload),"utf8");

            encryptedPayload = Buffer.concat([
                cipher.update(payloadBuf),
                cipher.final()
            ]);
        } else {
            encryptedPayload = Buffer.alloc(0);
        }

        const secondsPassed = Math.max(0, Math.floor((Date.now() - stamp.time) / 1000));

        const header = createMiioHeader({
            timestamp: stamp.val + secondsPassed,
            deviceId: deviceId,
            payloadLength: encryptedPayload.length,
            unknown: 0
        });


        const calculatedChecksum = crypto.createHash("md5")
            .update(header.slice(0, 16))
            .update(this.token)
            .update(encryptedPayload)
            .digest();

        calculatedChecksum.copy(header, 16);

        return Buffer.concat([header, encryptedPayload]);
    }
}

module.exports = Codec;
