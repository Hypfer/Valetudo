const crypto = require('crypto');

/**
 *
 * @param options {object}
 * @param options.token {Buffer}
 * @constructor
 */
const Codec = function(options) {
    this.setToken(options.token);
};

/** @param token {Buffer} */
Codec.prototype.setToken = function(token) {
    this.token = token;
    this.tokenKey = crypto.createHash('md5').update(this.token).digest();
    this.tokenIV = crypto.createHash('md5').update(this.tokenKey).update(this.token).digest();
};

Codec.prototype.handleResponse = function(response) {
    const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16);
    response.copy(header, 0,0,32);

    const encrypted = response.slice(32);
    const stamp = header.readUInt32BE(12);

    const digest = crypto.createHash('md5')
        .update(header.slice(0, 16))
        .update(this.token)
        .update(encrypted)
        .digest();

    const checksum = header.slice(16);
    let token = null;
    let msg = null;
    if (!checksum.equals(digest)) {
        if (encrypted.length > 0) {
            console.error("Invalid packet, checksum was "+ checksum + " should be " + digest);
        } else {
            // If we receive an empty packet with a wrong checksum, assume that we're getting
            // a new token.
            token = Buffer.from(header.slice(16));
        }
    } else if (encrypted.length > 0) {
        const decipher = crypto.createDecipheriv('aes-128-cbc', this.tokenKey, this.tokenIV);
        msg = JSON.parse(Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString().replace(/[\u0000-\u0019]+/g,""));
    }
    return {
        stamp: stamp,
        deviceId: header.readUInt32BE(8),
        msg: msg,
        token: token
    };
};

Codec.prototype.encode = function(msg, stamp, deviceId) {
    const cipher = crypto.createCipheriv('aes-128-cbc', this.tokenKey, this.tokenIV);
    const header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16);
    header[0] = 0x21;
    header[1] = 0x31;

    for(let i=4; i<32; i++) {
        header[i] = 0xff;
    }

    for(let i=4; i<8; i++) {
        header[i] = 0x00;
    }

    header.writeUInt32BE(deviceId, 8);

    const secondsPassed = Math.floor(Date.now() - stamp.time) / 1000;
    header.writeUInt32BE(stamp.val + secondsPassed, 12);

    const encrypted = Buffer.concat([
        cipher.update(msg),
        cipher.final()
    ]);

    header.writeUInt16BE(32 + encrypted.length, 2);

    //checksum
    const digest = crypto.createHash('md5')
        .update(header.slice(0, 16))
        .update(this.token)
        .update(encrypted)
        .digest();

    digest.copy(header, 16);

    return Buffer.concat([header, encrypted]);
};

module.exports = Codec;