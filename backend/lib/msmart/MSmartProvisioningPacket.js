class MSmartProvisioningPacket {
    /**
     * @param {object} options
     * @param {number} options.commandId
     * @param {Buffer} options.payload
     */
    constructor(options) {
        this.commandId = options.commandId;
        this.payload = options.payload;
    }

    /**
     * @returns {Buffer}
     */
    toBytes() {
        const coreCommand = Buffer.alloc(4 + this.payload.length);
        coreCommand.writeUInt16BE(this.commandId, 0);
        coreCommand.writeUInt16BE(this.payload.length, 2);
        this.payload.copy(coreCommand, 4);

        const checksum = MSmartProvisioningPacket.calculateChecksum(coreCommand);

        const finalPacket = Buffer.alloc(7 + this.payload.length);
        finalPacket[0] = 0xEE;
        finalPacket[1] = 0x01;
        coreCommand.copy(finalPacket, 2);
        finalPacket[finalPacket.length - 1] = checksum;

        return finalPacket;
    }

    /**
     * @param {Buffer} bytes
     * @returns {MSmartProvisioningPacket}
     */
    static FROM_BYTES(bytes) {
        if (bytes.length < 7) {
            throw new Error(`Packet too short. Expected at least 7 bytes, got ${bytes.length}.`);
        }
        if (bytes[0] !== 0xEE || bytes[1] !== 0x01) {
            throw new Error(`Invalid Magic Header. Expected 0xEE01, got 0x${bytes.toString("hex", 0, 2)}.`);
        }

        const coreCommand = bytes.subarray(2, bytes.length - 1);
        const expectedChecksum = MSmartProvisioningPacket.calculateChecksum(coreCommand);
        const actualChecksum = bytes[bytes.length - 1];

        if (actualChecksum !== expectedChecksum) {
            throw new Error(`Checksum mismatch. Calculated 0x${expectedChecksum.toString(16)}, but got 0x${actualChecksum.toString(16)}.`);
        }

        const commandId = coreCommand.readUInt16BE(0);
        const payloadLength = coreCommand.readUInt16BE(2);

        if (coreCommand.length !== 4 + payloadLength) {
            throw new Error(`Payload length mismatch. Header says ${payloadLength}, but actual was ${coreCommand.length - 4}.`);
        }

        return new MSmartProvisioningPacket({
            commandId: commandId,
            payload: coreCommand.subarray(4)
        });
    }

    /**
     * @param {Buffer} data
     * @returns {number}
     */
    static calculateChecksum(data) {
        const sum = data.reduce((acc, val) => acc + val, 0);
        return sum & 0xFF;
    }
}

MSmartProvisioningPacket.RESPONSE_ID_OFFSET = 0b1000000000000000; // FIXME: naming

MSmartProvisioningPacket.COMMAND_IDS = Object.freeze({
    CMD_ALL_INFO: 208,
    CMD_UUID_INFO: 213,

    // The robot can also send "commands"
    CMD_NOTIFY_PROGRESS: 222,
    CMD_NOTIFY_RESULT: 223
});

MSmartProvisioningPacket.RESPONSE_IDS = Object.freeze({
    CMD_ALL_INFO: MSmartProvisioningPacket.COMMAND_IDS.CMD_ALL_INFO + MSmartProvisioningPacket.RESPONSE_ID_OFFSET,
    CMD_UUID_INFO: MSmartProvisioningPacket.COMMAND_IDS.CMD_UUID_INFO + MSmartProvisioningPacket.RESPONSE_ID_OFFSET,
    CMD_NOTIFY_PROGRESS: MSmartProvisioningPacket.COMMAND_IDS.CMD_NOTIFY_PROGRESS + MSmartProvisioningPacket.RESPONSE_ID_OFFSET,
    CMD_NOTIFY_RESULT: MSmartProvisioningPacket.COMMAND_IDS.CMD_NOTIFY_RESULT + MSmartProvisioningPacket.RESPONSE_ID_OFFSET
});

module.exports = MSmartProvisioningPacket;
