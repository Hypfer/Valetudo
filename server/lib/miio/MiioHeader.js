/**
 * @param {object} options
 * @param {number=} options.timestamp
 * @param {number=} options.deviceId
 * @param {number=} options.payloadLength
 * @param {number=} options.unknown
 * @returns {Buffer}
 */
function createMiioHeader(options = {}) {
    const headerLength = 32;
    const header = Buffer.alloc(headerLength, 0xff);
    header[0] = 0x21;
    header[1] = 0x31;
    header.writeUInt16BE((options.payloadLength ?? 0) + headerLength, 2);
    header.writeUInt32BE(options.unknown !== undefined ? options.unknown : 0xffffffff, 4);
    header.writeUInt32BE(options.deviceId !== undefined ? options.deviceId : 0xffffffff, 8);
    header.writeUInt32BE(options.timestamp !== undefined ? options.timestamp : 0xffffffff, 12);
    return header;
}

module.exports = createMiioHeader;
