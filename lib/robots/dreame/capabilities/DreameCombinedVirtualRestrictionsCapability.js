/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const DreameMapParser = require("../../../DreameMapParser");

//TODO: broken atm

class DreameCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     *
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.virtualRestrictions
     * @param {number} options.miot_properties.virtualRestrictions.piid
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
        if (!( //TODO: refactor
            this.robot.state.map &&
            this.robot.state.map.metaData &&
            this.robot.state.map.metaData.defaultMap !== true &&
            this.robot.state.map.metaData.dreame && this.robot.state.map.metaData.dreame.offsets
        )) {
            /**
             * The coordinates are relative to the existing maps viewport
             * The valetudo map format removes all viewport-related things from the data and contains a
             * map with no further logic needed.
             *
             * Therefore, to implement this, we're using the metaData feature of the Map class which is
             * also an entity
             * Planning ahead was actually worth it :)
             */
            throw new Error("Cannot save virtual restrictions due to missing map data");
        }

        const offsets = this.robot.state.map.metaData.dreame.offsets;
        const dreamePayload = {
            rect: [],
            line: [],
            mop: []
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
            dreamePayload.line.push([
                (wall.points.pA.y + offsets.left) * 10 - DreameMapParser.HALF_INT16,
                (wall.points.pA.x + offsets.top) * 10 - DreameMapParser.HALF_INT16,
                (wall.points.pB.y + offsets.left) * 10 - DreameMapParser.HALF_INT16,
                (wall.points.pB.x + offsets.top) * 10 - DreameMapParser.HALF_INT16,
            ]);
        });

        virtualRestrictions.restrictedZones.forEach(zone => {
            dreamePayload.rect.push([
                (zone.points.pA.y + offsets.left) * 10 - DreameMapParser.HALF_INT16,
                (zone.points.pA.x + offsets.top) * 10 - DreameMapParser.HALF_INT16,
                (zone.points.pC.y + offsets.left) * 10 - DreameMapParser.HALF_INT16,
                (zone.points.pC.x + offsets.top) * 10 - DreameMapParser.HALF_INT16,
            ]);
        });

        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.virtualRestrictions.piid,
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
