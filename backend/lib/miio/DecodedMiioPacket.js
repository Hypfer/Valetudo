class DecodedMiioPacket {
    /**
     * @param {object} options
     * @param {number} options.stamp
     * @param {number} options.deviceId
     * @param {any} options.msg
     * @param {Buffer?} options.token
     */
    constructor(options) {
        this.stamp = options.stamp;
        this.deviceId = options.deviceId;
        this.msg = options.msg;
        this.token = options.token;
    }
}

module.exports = DecodedMiioPacket;
