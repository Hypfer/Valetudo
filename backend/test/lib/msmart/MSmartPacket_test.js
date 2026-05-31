const assert = require("node:assert");
const MSmartPacket = require("../../../lib/msmart/MSmartPacket");
const { describe, it } = require("node:test");

describe("MSmartPacket", () => {

    describe("FROM_BYTES", () => {
        it("parses a short, valid B8 packet", () => {
            const hexString = "aa0eb800000000000002aa0122006b";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartPacket.FROM_BYTES(buffer);

            assert.ok(packet instanceof MSmartPacket);
            assert.strictEqual(packet.deviceType, 0xB8);
            assert.strictEqual(packet.messageId, 0x00);
            assert.strictEqual(packet.protocolVersion, 0x00);
            assert.strictEqual(packet.deviceProtocolVersion, 0x00);
            assert.strictEqual(packet.messageType, 0x02);
            assert.deepStrictEqual(packet.payload, Buffer.from("aa012200", "hex"));
        });

        it("parses locate command", () => {
            const hexString = "aa0db800000000000003aa01018c";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartPacket.FROM_BYTES(buffer);

            assert.ok(packet instanceof MSmartPacket);
            assert.strictEqual(packet.deviceType, 0xB8);
            assert.strictEqual(packet.messageId, 0x00);
            assert.strictEqual(packet.protocolVersion, 0x00);
            assert.strictEqual(packet.deviceProtocolVersion, 0x00);
            assert.strictEqual(packet.messageType, 0x03);
            assert.deepStrictEqual(packet.payload, Buffer.from("aa0101", "hex"));
        });

        it("parses a long, valid B8 packet", () => {
            const hexString = "aa51b800000000000004aa0101120002ff00010078000062000100000000000100000000740001000400002e0000010000000001010020000000000f02003518000297010300000000300021000000030836";
            const payloadHexString = "aa0101120002ff00010078000062000100000000000100000000740001000400002e0000010000000001010020000000000f020035180002970103000000003000210000000308";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartPacket.FROM_BYTES(buffer);

            assert.ok(packet instanceof MSmartPacket);
            assert.strictEqual(packet.deviceType, 0xB8);
            assert.strictEqual(packet.messageId, 0x00);
            assert.strictEqual(packet.protocolVersion, 0x00);
            assert.strictEqual(packet.deviceProtocolVersion, 0x00);
            assert.strictEqual(packet.messageType, 0x04);
            assert.deepStrictEqual(packet.payload, Buffer.from(payloadHexString, "hex"));
        });

        it("throws for a packet that is too short", () => {
            const invalidBuffer = Buffer.from("aa0102030405", "hex");

            assert.throws(
                () => MSmartPacket.FROM_BYTES(invalidBuffer),
                /Packet too short/
            );
        });

        it("throws for a packet with an invalid magic byte", () => {
            const invalidBuffer = Buffer.from("bb0eb800000000000002aa0122006b", "hex");

            assert.throws(
                () => MSmartPacket.FROM_BYTES(invalidBuffer),
                /Invalid Magic Byte/
            );
        });

        it("throws for a packet with a length mismatch", () => {
            const invalidBuffer = Buffer.from("aa0db800000000000002aa0122006b", "hex");

            assert.throws(
                () => MSmartPacket.FROM_BYTES(invalidBuffer),
                /Length mismatch/
            );
        });

        it("throws for a packet with an invalid checksum", () => {
            const invalidBuffer = Buffer.from("aa0eb800000000000002aa01220000", "hex");

            assert.throws(
                () => MSmartPacket.FROM_BYTES(invalidBuffer),
                /Checksum mismatch/
            );
        });
    });

    describe("toBytes", () => {
        it("round-trips a serialized packet", () => {
            const originalPacket = new MSmartPacket({
                deviceType: 0xAC,
                messageId: 0x01,
                protocolVersion: 0x00,
                deviceProtocolVersion: 0x01,
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: Buffer.from([0xB0, 0x01, 0x01])
            });

            const buffer = originalPacket.toBytes();

            const expectedHexString = "aa0dac00000001000102b0010191";
            assert.strictEqual(buffer.toString("hex"), expectedHexString);

            const parsedPacket = MSmartPacket.FROM_BYTES(buffer);

            assert.deepStrictEqual(parsedPacket, originalPacket);
        });
    });
});
