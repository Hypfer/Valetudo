const assert = require("node:assert");
const MSmartProvisioningPacket = require("../../../lib/msmart/MSmartProvisioningPacket");
const { describe, it } = require("node:test");

describe("MSmartProvisioningPacket", () => {

    describe("FROM_BYTES", () => {
        it("parses a valid 'Get UUID' response", () => {
            const hexString = "ee0180d500183138333239353934333937373939313337353561616161614c";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartProvisioningPacket.FROM_BYTES(buffer);

            assert.ok(packet instanceof MSmartProvisioningPacket);
            assert.strictEqual(packet.commandId, MSmartProvisioningPacket.RESPONSE_IDS.CMD_UUID_INFO);
            assert.deepStrictEqual(packet.payload, Buffer.from("313833323935393433393737393931333735356161616161", "hex"));
        });

        it("parses a valid 'Acknowledge Provisioning' response", () => {
            const hexString = "ee0180d000010051";
            const buffer = Buffer.from(hexString, "hex");

            const packet = MSmartProvisioningPacket.FROM_BYTES(buffer);

            assert.ok(packet instanceof MSmartProvisioningPacket);
            assert.strictEqual(packet.commandId, MSmartProvisioningPacket.RESPONSE_IDS.CMD_ALL_INFO);
            assert.deepStrictEqual(packet.payload, Buffer.from("00", "hex"));
        });

        it("throws for a packet that is too short", () => {
            const invalidBuffer = Buffer.from("ee0100d5", "hex");

            assert.throws(
                () => MSmartProvisioningPacket.FROM_BYTES(invalidBuffer),
                /Packet too short/
            );
        });

        it("throws for a packet with an invalid magic header", () => {
            const invalidBuffer = Buffer.from("ff0180d000010051", "hex");

            assert.throws(
                () => MSmartProvisioningPacket.FROM_BYTES(invalidBuffer),
                /Invalid Magic Header/
            );
        });

        it("throws for a packet with a length mismatch", () => {
            const invalidBuffer = Buffer.from("ee0180d000020052", "hex");

            assert.throws(
                () => MSmartProvisioningPacket.FROM_BYTES(invalidBuffer),
                /Payload length mismatch/
            );
        });

        it("throws for a packet with an invalid checksum", () => {
            const invalidBuffer = Buffer.from("ee0180d000010000", "hex");

            assert.throws(
                () => MSmartProvisioningPacket.FROM_BYTES(invalidBuffer),
                /Checksum mismatch/
            );
        });
    });

    describe("toBytes", () => {
        it("round-trips a serialized packet", () => {
            const originalPacket = new MSmartProvisioningPacket({
                commandId: MSmartProvisioningPacket.COMMAND_IDS.CMD_UUID_INFO,
                payload: Buffer.from([0x00])
            });

            const buffer = originalPacket.toBytes();

            const expectedHexString = "ee0100d5000100d6";
            assert.strictEqual(buffer.toString("hex"), expectedHexString);

            const parsedPacket = MSmartProvisioningPacket.FROM_BYTES(buffer);

            assert.deepStrictEqual(parsedPacket, originalPacket);
        });

        it("round-trips a packet with a larger payload", () => {
            const payload = Buffer.from("SSID\nPASSWORD\nhttps://server.com/\nGMT+00:00\nTOKEN\n-60\nDE");

            const originalPacket = new MSmartProvisioningPacket({
                commandId: MSmartProvisioningPacket.COMMAND_IDS.CMD_ALL_INFO,
                payload: payload
            });

            const buffer = originalPacket.toBytes();

            const parsedPacket = MSmartProvisioningPacket.FROM_BYTES(buffer);

            assert.deepStrictEqual(parsedPacket, originalPacket);
        });
    });
});
