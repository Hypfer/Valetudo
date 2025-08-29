const MSmartProvisioningPacket = require("../../../lib/msmart/MSmartProvisioningPacket");
const should = require("should");

should.config.checkProtoEql = false;

describe("MSmartProvisioningPacket", function () {

    describe("Static FROM_BYTES Parser", function() {
        it("Should parse a valid 'Get UUID' response correctly", function() {
            const hexString = "ee0180d500183138333239353934333937373939313337353561616161614c";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartProvisioningPacket.FROM_BYTES(buffer);

            packet.should.be.an.instanceOf(MSmartProvisioningPacket);
            packet.commandId.should.equal(MSmartProvisioningPacket.RESPONSE_IDS.CMD_UUID_INFO);
            packet.payload.should.deepEqual(Buffer.from("313833323935393433393737393931333735356161616161", "hex"));
        });

        it("Should parse a valid 'Acknowledge Provisioning' response correctly", function() {
            const hexString = "ee0180d000010051";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartProvisioningPacket.FROM_BYTES(buffer);

            packet.should.be.an.instanceOf(MSmartProvisioningPacket);
            packet.commandId.should.equal(MSmartProvisioningPacket.RESPONSE_IDS.CMD_ALL_INFO);
            packet.payload.should.deepEqual(Buffer.from("00", "hex"));
        });

        it("Should throw an error for a packet that is too short", function() {
            const invalidBuffer = Buffer.from("ee0100d5", "hex");

            (() => {
                MSmartProvisioningPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Packet too short/);
        });

        it("Should throw an error for a packet with an invalid magic header", function() {
            const invalidBuffer = Buffer.from("ff0180d000010051", "hex");

            (() => {
                MSmartProvisioningPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Invalid Magic Header/);
        });

        it("Should throw an error for a packet with a length mismatch", function() {
            // Length field is 0x0002, but actual payload length is 1 byte
            const invalidBuffer = Buffer.from("ee0180d000020052", "hex");

            (() => {
                MSmartProvisioningPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Payload length mismatch/);
        });

        it("Should throw an error for a packet with an invalid checksum", function() {
            // Valid checksum is 0x51, we use 0x00
            const invalidBuffer = Buffer.from("ee0180d000010000", "hex");

            (() => {
                MSmartProvisioningPacket.FROM_BYTES(invalidBuffer);
            }).should.throw(/Checksum mismatch/);
        });
    });

    describe("Instance toBytes Serializer", function() {
        it("Should correctly serialize a packet that can be parsed again (round-trip)", function() {
            // 1. Create a packet for a "Get UUID" command
            const originalPacket = new MSmartProvisioningPacket({
                commandId: MSmartProvisioningPacket.COMMAND_IDS.CMD_UUID_INFO,
                payload: Buffer.from([0x00])
            });

            // 2. Serialize it to a buffer
            const buffer = originalPacket.toBytes();

            // 3. Check if the buffer matches the known-good hex string (checksum may vary based on exact implementation details but should be consistent)
            const expectedHexString = "ee0100d5000100d6";
            buffer.toString("hex").should.equal(expectedHexString);

            // 4. Parse it back
            const parsedPacket = MSmartProvisioningPacket.FROM_BYTES(buffer);

            // 5. Ensure the parsed packet is identical to the original
            parsedPacket.should.deepEqual(originalPacket);
        });

        it("Should correctly serialize a packet with a larger payload (round-trip)", function() {
            const payload = Buffer.from("SSID\nPASSWORD\nhttps://server.com/\nGMT+00:00\nTOKEN\n-60\nDE");

            // 1. Create a packet for a "Send All Info" command
            const originalPacket = new MSmartProvisioningPacket({
                commandId: MSmartProvisioningPacket.COMMAND_IDS.CMD_ALL_INFO,
                payload: payload
            });

            // 2. Serialize it to a buffer
            const buffer = originalPacket.toBytes();

            // 3. Parse it back
            const parsedPacket = MSmartProvisioningPacket.FROM_BYTES(buffer);

            // 4. Ensure the parsed packet is identical to the original
            parsedPacket.should.deepEqual(originalPacket);
        });
    });
});
