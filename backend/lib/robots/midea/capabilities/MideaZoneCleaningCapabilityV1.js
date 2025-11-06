const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");

/**
 * @extends ZoneCleaningCapability<import("../MideaValetudoRobot")>
 */
class MideaZoneCleaningCapabilityV1 extends ZoneCleaningCapability {
    /**
     * @param {object} options
     * @param {Array<import("../../../entities/core/ValetudoZone")>} options.zones
     * @param {number} [options.iterations]
     * @returns {Promise<void>}
     */
    async start(options) {
        if (options.zones.length > 5) {
            throw new Error("Cannot clean more than 5 zones at once.");
        }

        // 1 byte zone count + 9 byte per zone
        const zoneDataPayload = Buffer.alloc(1 + options.zones.length * 9);

        zoneDataPayload[0] = options.zones.length;

        options.zones.forEach((zone, i) => {
            const offset = 1 + i * 9;

            const pA = this.robot.mapParser.convertToMideaCoordinates(zone.points.pA.x, zone.points.pA.y);
            const pC = this.robot.mapParser.convertToMideaCoordinates(zone.points.pC.x, zone.points.pC.y);

            zoneDataPayload[offset] = i + 1;
            zoneDataPayload.writeUInt16LE(pA.x, offset + 1); // left
            zoneDataPayload.writeUInt16LE(pA.y, offset + 3); // top
            zoneDataPayload.writeUInt16LE(pC.x, offset + 5); // right
            zoneDataPayload.writeUInt16LE(pC.y, offset + 7); // bottom
        });


        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.concat([
                    Buffer.from([
                        0x0f // zone cleaning
                    ]),
                    zoneDataPayload,
                    Buffer.from([options.iterations ?? 1])
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {import("../../../core/capabilities/ZoneCleaningCapability").ZoneCleaningCapabilityProperties}
     */
    getProperties() {
        return {
            zoneCount: {
                min: 1,
                max: 5
            },
            iterationCount: {
                min: 1,
                max: 3
            }
        };
    }
}

module.exports = MideaZoneCleaningCapabilityV1;
