class MSmartPacket {
    /**
     * @param {object} options
     * @param {number} [options.deviceType]
     * @param {number} [options.messageId]
     * @param {number} [options.protocolVersion]
     * @param {number} [options.deviceProtocolVersion]
     * @param {number} options.messageType
     * @param {Buffer} options.payload
     */
    constructor(options) {
        this.deviceType = options.deviceType ?? MSmartPacket.DEVICE_TYPE.VACUUM;
        this.messageId = options.messageId ?? 0;
        this.protocolVersion = options.protocolVersion ?? 0;
        this.deviceProtocolVersion = options.deviceProtocolVersion ?? 0;
        this.messageType = options.messageType;
        this.payload = options.payload;
    }

    /**
     * Serializes the packet into a Buffer for transmission.
     * @returns {Buffer}
     */
    toBytes() {
        const length = 10 + this.payload.length;
        if (length > 255) {
            throw new Error(`Invalid MSmartPacket! Length ${length} > 255)`);
        }

        const header = Buffer.alloc(10);
        header[0] = 0xAA;
        header[1] = length;
        header[2] = this.deviceType;
        header[3] = 0x00;
        header[4] = 0x00;
        header[5] = 0x00;
        header[6] = this.messageId;
        header[7] = this.protocolVersion;
        header[8] = this.deviceProtocolVersion;
        header[9] = this.messageType;

        const dataToChecksum = Buffer.concat([header.subarray(1), this.payload]);
        const checksum = MSmartPacket.calculateChecksum(dataToChecksum);

        return Buffer.concat([header, this.payload, Buffer.from([checksum])]);
    }

    /**
     * @returns {string}
     */
    toHexString() {
        return this.toBytes().toString("hex");
    }

    /**
     * @param {Buffer} bytes
     * @returns {MSmartPacket}
     */
    static FROM_BYTES(bytes) {
        if (bytes.length < 11) {
            throw new Error(`Packet too short. Expected at least 11 bytes, got ${bytes.length}.`);
        }
        if (bytes[0] !== 0xAA) {
            throw new Error(`Invalid Magic Byte. Expected 0xAA, got 0x${bytes[0].toString(16)}.`);
        }
        if (bytes[1] !== bytes.length - 1) {
            throw new Error(`Length mismatch. Length byte is ${bytes[1]}, but packet length is ${bytes.length}.`);
        }

        const dataToChecksum = bytes.subarray(1, bytes.length - 1);
        const expectedChecksum = MSmartPacket.calculateChecksum(dataToChecksum);
        const actualChecksum = bytes[bytes.length - 1];

        if (actualChecksum !== expectedChecksum) {
            throw new Error(`Checksum mismatch. Calculated 0x${expectedChecksum.toString(16)}, but got 0x${actualChecksum.toString(16)}.`);
        }

        return new MSmartPacket({
            deviceType: bytes[2],
            messageId: bytes[6],
            protocolVersion: bytes[7],
            deviceProtocolVersion: bytes[8],
            messageType: bytes[9],
            payload: bytes.subarray(10, bytes.length - 1)
        });
    }

    /**
     * @param {Buffer} data
     * @returns {number}
     */
    static calculateChecksum(data) {
        const sum = data.reduce((acc, val) => acc + val, 0);
        return (~sum + 1) & 0xFF;
    }

    /**
     *
     * @param {number} commandId
     * @param {Buffer} [actualPayload]
     * @return {Buffer}
     */
    static buildPayload(commandId, actualPayload) {
        const header = Buffer.from([0xaa, 0x01, commandId]);
        if (actualPayload === undefined) {
            return header;
        }

        return Buffer.concat([
            header,
            actualPayload
        ]);
    }
}

MSmartPacket.DEVICE_TYPE = Object.freeze({
    VACUUM: 0xb8
});

MSmartPacket.MESSAGE_TYPE = Object.freeze({
    SETTING: 0x02,
    ACTION: 0x03,
    EVENT: 0x04,
    DOCK: 0x06
});

module.exports = MSmartPacket;
