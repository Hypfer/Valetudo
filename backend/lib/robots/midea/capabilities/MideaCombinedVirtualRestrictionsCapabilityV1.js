/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const ValetudoRestrictedZone = require("../../../entities/core/ValetudoRestrictedZone");
const {sleep} = require("../../../utils/misc");

/**
 * @extends CombinedVirtualRestrictionsCapability<import("../MideaValetudoRobot")>
 */
class MideaCombinedVirtualRestrictionsCapabilityV1 extends CombinedVirtualRestrictionsCapability {
    /**
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        if (virtualRestrictions.virtualWalls.length > 10) {
            throw new Error("Can't store more than 10 virtual walls.");
        }
        if (
            virtualRestrictions.restrictedZones.filter(e => e.type === ValetudoRestrictedZone.TYPE.REGULAR).length > 10
        ) {
            throw new Error("Can't store more than 10 no-go zones.");
        }
        if (
            virtualRestrictions.restrictedZones.filter(e => e.type === ValetudoRestrictedZone.TYPE.MOP).length > 10
        ) {
            throw new Error("Can't store more than 10 no-mop zones.");
        }

        const regularZone = virtualRestrictions.restrictedZones.filter(e => e.type === ValetudoRestrictedZone.TYPE.REGULAR);
        const mopZone = virtualRestrictions.restrictedZones.filter(e => e.type === ValetudoRestrictedZone.TYPE.MOP);


        const wallDataPayload = Buffer.alloc(1 + (virtualRestrictions.virtualWalls.length * 9));

        wallDataPayload[0] = virtualRestrictions.virtualWalls.length;
        virtualRestrictions.virtualWalls.forEach((wall, i) => {
            const offset = 1 + (i * 9);
            const pA = this.robot.mapParser.convertToMideaCoordinates(wall.points.pA.x, wall.points.pA.y);
            const pB = this.robot.mapParser.convertToMideaCoordinates(wall.points.pB.x, wall.points.pB.y);

            wallDataPayload[offset] = i + 1; // ID
            wallDataPayload.writeUInt16LE(pA.x, offset + 1);
            wallDataPayload.writeUInt16LE(pA.y, offset + 3);
            wallDataPayload.writeUInt16LE(pB.x, offset + 5);
            wallDataPayload.writeUInt16LE(pB.y, offset + 7);
        });


        const zoneDataPayload = Buffer.alloc(1 + (regularZone.length * 9));

        zoneDataPayload[0] = regularZone.length;
        regularZone.forEach((zone, i) => {
            const offset = 1 + (i * 9);
            const pA = this.robot.mapParser.convertToMideaCoordinates(zone.points.pA.x, zone.points.pA.y);
            const pC = this.robot.mapParser.convertToMideaCoordinates(zone.points.pC.x, zone.points.pC.y);

            zoneDataPayload[offset] = i + 1; // ID
            zoneDataPayload.writeUInt16LE(pA.x, offset + 1);
            zoneDataPayload.writeUInt16LE(pA.y, offset + 3);
            zoneDataPayload.writeUInt16LE(pC.x, offset + 5);
            zoneDataPayload.writeUInt16LE(pC.y, offset + 7);
        });

        const mopZoneDataPayload = Buffer.alloc(1 + (mopZone.length * 9));

        mopZoneDataPayload[0] = mopZone.length;
        mopZone.forEach((zone, i) => {
            const offset = 1 + (i * 9);
            const pA = this.robot.mapParser.convertToMideaCoordinates(zone.points.pA.x, zone.points.pA.y);
            const pC = this.robot.mapParser.convertToMideaCoordinates(zone.points.pC.x, zone.points.pC.y);

            mopZoneDataPayload[offset] = i + 1; // ID
            mopZoneDataPayload.writeUInt16LE(pA.x, offset + 1);
            mopZoneDataPayload.writeUInt16LE(pA.y, offset + 3);
            mopZoneDataPayload.writeUInt16LE(pC.x, offset + 5);
            mopZoneDataPayload.writeUInt16LE(pC.y, offset + 7);
        });


        const wallPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.concat([
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_VIRTUAL_WALLS
                    ]),
                    wallDataPayload
                ])
            )
        });
        const zonePacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.concat([
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_RESTRICTED_ZONES
                    ]),
                    zoneDataPayload
                ])
            )
        });
        const mopZonePacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.concat([
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_RESTRICTED_MOP_ZONES
                    ]),
                    mopZoneDataPayload
                ])
            )
        });

        await this.robot.sendCommand(wallPacket.toHexString());
        await this.robot.sendCommand(zonePacket.toHexString());
        await this.robot.sendCommand(mopZonePacket.toHexString());

        this.robot.pollMap();
        await sleep(4_000); // TODO: is this enough?
    }

    /**
     * @returns {import("../../../core/capabilities/CombinedVirtualRestrictionsCapability").CombinedVirtualRestrictionsCapabilityProperties}
     */
    getProperties() {
        return {
            supportedRestrictedZoneTypes: [
                ValetudoRestrictedZone.TYPE.REGULAR,
                ValetudoRestrictedZone.TYPE.MOP,
            ]
        };
    }
}

module.exports = MideaCombinedVirtualRestrictionsCapabilityV1;
