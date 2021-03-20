/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const DreameMapParser = require("../DreameMapParser");
const ValetudoRestrictedZone = require("../../../entities/core/ValetudoRestrictedZone");

class DreameCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     *
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     * @param {Array<import("../../../entities/core/ValetudoRestrictedZone").ValetudoRestrictedZoneType>} [options.supportedRestrictedZoneTypes]
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mapDetails
     * @param {number} options.miot_properties.mapDetails.piid
     *
     * @param {object} options.miot_properties.actionResult
     * @param {number} options.miot_properties.actionResult.piid
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }

    /**
     *
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        const dreamePayload = {
            rect: [],
            line: [],
            mop: [] //We might need to remove this on the 1c
        };

        /**
         * The payload can also contain a key named "temp" with an empty object as its value
         * That can be used to draw virtual restrictions if the map is only temporary.
         *
         * This is a useful feature for the initial mapping process, since you're able to pause the robot
         * and draw a virtual restriction instead of having to remove all obstacles once for the initial
         * mapping run
         *
         * We won't use that so we'll leave this out.
         */

        if (virtualRestrictions.virtualWalls.length >= 10) {
            throw new Error("Too many virtual Walls to save");
        }

        if (virtualRestrictions.restrictedZones.length >= 10) {
            throw new Error("Too many restricted zones to save");
        }

        virtualRestrictions.virtualWalls.forEach(wall => {
            const pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(wall.points.pA.x, wall.points.pA.y);
            const pB = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(wall.points.pB.x, wall.points.pB.y);

            dreamePayload.line.push([
                pA.x,
                pA.y,

                pB.x,
                pB.y
            ]);
        });

        virtualRestrictions.restrictedZones.forEach(zone => {
            let destination;

            switch (zone.type) {
                case ValetudoRestrictedZone.TYPE.REGULAR:
                    destination = dreamePayload.rect;
                    break;
                case ValetudoRestrictedZone.TYPE.MOP:
                    destination = dreamePayload.mop;
                    break;
            }

            const pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(zone.points.pA.x, zone.points.pA.y);
            const pC = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(zone.points.pC.x, zone.points.pC.y);

            destination.push([
                pA.x,
                pA.y,

                pC.x,
                pC.y
            ]);
        });

        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({vw: dreamePayload})
                    }
                ]
            }
        ).then(res => {
            if (
                res && res.siid === this.miot_actions.map_edit.siid &&
                res.aiid === this.miot_actions.map_edit.aiid &&
                Array.isArray(res.out) && res.out.length === 1 &&
                res.out[0].piid === this.miot_properties.actionResult.piid
            ) {
                switch (res.out[0].value) {
                    case 0:
                        return;
                    case 10:
                        throw new Error("Cannot save temporary virtual restrictions. A persistent map exists.");
                    default:
                        throw new Error("Got error " + res.out[0].value + " while saving virtual restrictions.");
                }
            }
        }).finally(() => {
            this.robot.pollMap();
        });
    }
}

module.exports = DreameCombinedVirtualRestrictionsCapability;
