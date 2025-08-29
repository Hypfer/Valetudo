const MSmartPacket = require("../../../lib/msmart/MSmartPacket");
const should = require("should");

should.config.checkProtoEql = false;

describe("MSmartPacket", function () {

    describe("Static FROM_BYTES Parser", function() {
        it("Should parse a short, valid B8 packet correctly", function() {
            const hexString = "aa0eb800000000000002aa0122006b";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartPacket.FROM_BYTES(buffer);

            packet.should.be.an.instanceOf(MSmartPacket);
            packet.deviceType.should.equal(0xB8);
            packet.messageId.should.equal(0x00);
            packet.protocolVersion.should.equal(0x00);
            packet.deviceProtocolVersion.should.equal(0x00);
            packet.messageType.should.equal(0x02);
            packet.payload.should.deepEqual(Buffer.from("aa012200", "hex"));
        });

        it("Should parse locate command correctly", function() {
            const hexString = "aa0db800000000000003aa01018c";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartPacket.FROM_BYTES(buffer);

            packet.should.be.an.instanceOf(MSmartPacket);
            packet.deviceType.should.equal(0xB8);
            packet.messageId.should.equal(0x00);
            packet.protocolVersion.should.equal(0x00);
            packet.deviceProtocolVersion.should.equal(0x00);
            packet.messageType.should.equal(0x03);
            packet.payload.should.deepEqual(Buffer.from("aa0101", "hex"));
        });

        it("Should parse a long, valid B8 packet correctly", function() {
            const hexString = "aa51b800000000000004aa0101120002ff00010078000062000100000000000100000000740001000400002e0000010000000001010020000000000f02003518000297010300000000300021000000030836";
            const payloadHexString = "aa0101120002ff00010078000062000100000000000100000000740001000400002e0000010000000001010020000000000f020035180002970103000000003000210000000308";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartPacket.FROM_BYTES(buffer);

            packet.should.be.an.instanceOf(MSmartPacket);
            packet.deviceType.should.equal(0xB8);
            packet.messageId.should.equal(0x00);
            packet.protocolVersion.should.equal(0x00);
            packet.deviceProtocolVersion.should.equal(0x00);
            packet.messageType.should.equal(0x04);
            packet.payload.should.deepEqual(Buffer.from(payloadHexString, "hex"));
        });

        it("Should throw an error for a packet that is too short", function() {
            const invalidBuffer = Buffer.from("aa0102030405", "hex");

            (() => {
                MSmartPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Packet too short/);
        });

        it("Should throw an error for a packet with an invalid magic byte", function() {
            const invalidBuffer = Buffer.from("bb0eb800000000000002aa0122006b", "hex");

            (() => {
                MSmartPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Invalid Magic Byte/);
        });

        it("Should throw an error for a packet with a length mismatch", function() {
            // Length byte is 0x0D (13), but actual length is 15 bytes (so length byte should be 0x0E)
            const invalidBuffer = Buffer.from("aa0db800000000000002aa0122006b", "hex");

            (() => {
                MSmartPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Length mismatch/);
        });

        it("Should throw an error for a packet with an invalid checksum", function() {
            // Valid checksum is 0x6b, we use 0x00
            const invalidBuffer = Buffer.from("aa0eb800000000000002aa01220000", "hex");

            (() => {
                MSmartPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Checksum mismatch/);
        });
    });

    describe("Instance toBytes Serializer", function() {
        it("Should correctly serialize a packet that can be parsed again (round-trip)", function() {
            // 1. Create a packet from known data
            const originalPacket = new MSmartPacket({
                deviceType: 0xAC,
                messageId: 0x01,
                protocolVersion: 0x00,
                deviceProtocolVersion: 0x01,
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: Buffer.from([0xB0, 0x01, 0x01])
            });

            // 2. Serialize it to a buffer
            const buffer = originalPacket.toBytes();

            // 3. Check if the buffer matches a known-good hex string
            const expectedHexString = "aa0dac00000001000102b0010191";
            buffer.toString("hex").should.equal(expectedHexString);

            // 4. Parse it back
            const parsedPacket = MSmartPacket.FROM_BYTES(buffer);

            // 5. Ensure the parsed packet is identical to the original
            parsedPacket.should.deepEqual(originalPacket);
        });
    });
});
