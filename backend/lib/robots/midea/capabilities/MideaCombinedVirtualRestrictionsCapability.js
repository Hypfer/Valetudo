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
class MideaCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
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


        const zoneDataPayload = Buffer.alloc(1 + (virtualRestrictions.restrictedZones.length * 10));

        zoneDataPayload[0] = virtualRestrictions.restrictedZones.length;
        virtualRestrictions.restrictedZones.forEach((zone, i) => {
            const offset = 1 + (i * 10);
            const pA = this.robot.mapParser.convertToMideaCoordinates(zone.points.pA.x, zone.points.pA.y);
            const pC = this.robot.mapParser.convertToMideaCoordinates(zone.points.pC.x, zone.points.pC.y);

            zoneDataPayload[offset] = zone.type === ValetudoRestrictedZone.TYPE.REGULAR ? 0 : 1;
            zoneDataPayload[offset + 1] = i + 1; // ID
            zoneDataPayload.writeUInt16LE(pA.x, offset + 2);
            zoneDataPayload.writeUInt16LE(pA.y, offset + 4);
            zoneDataPayload.writeUInt16LE(pC.x, offset + 6);
            zoneDataPayload.writeUInt16LE(pC.y, offset + 8);
        });


        const wallPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(MSmartConst.SETTING.SET_VIRTUAL_WALLS, wallDataPayload)
        });
        const zonePacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(MSmartConst.SETTING.SET_RESTRICTED_ZONES, zoneDataPayload)
        });

        await this.robot.sendCommand(wallPacket.toHexString());
        await this.robot.sendCommand(zonePacket.toHexString());

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

module.exports = MideaCombinedVirtualRestrictionsCapability;
