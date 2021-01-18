const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");
const DreameMapParser = require("../../../DreameMapParser");

class DreameZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     *
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.start
     * @param {number} options.miot_actions.start.siid
     * @param {number} options.miot_actions.start.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mode
     * @param {object} options.miot_properties.mode.piid
     * @param {object} options.miot_properties.additionalCleanupParameters
     * @param {number} options.miot_properties.additionalCleanupParameters.piid
     *
     * @param {number} options.zoneCleaningModeId
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;

        this.zoneCleaningModeId = options.zoneCleaningModeId;
    }


    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        if (!(
            this.robot.state.map &&
            this.robot.state.map.metaData &&
            this.robot.state.map.metaData.defaultMap !== true &&
            this.robot.state.map.metaData.dreame && this.robot.state.map.metaData.dreame.offsets
        )) {
            /**
             * The zone coordinates are relative to the existing maps viewport
             * The valetudo map format removes all viewport-related things from the data and contains a
             * map with no further logic needed.
             *
             * Therefore, to implement this, we're using the metaData feature of the Map class which is
             * also an entity
             * Planning ahead was actually worth it :)
             */
            throw new Error("Cannot start zoned cleanup due to missing map data");
        }

        const offsets = this.robot.state.map.metaData.dreame.offsets;
        const zones = [];

        valetudoZones.forEach((vZ, i) => {
            zones.push([ //TODO: refactor this to a method of the mapParser?
                (vZ.points.pA.y + offsets.left) * 10 - DreameMapParser.HALF_INT16,
                (vZ.points.pA.x + offsets.top) * 10 - DreameMapParser.HALF_INT16,
                (vZ.points.pC.y + offsets.left) * 10 - DreameMapParser.HALF_INT16,
                (vZ.points.pC.x + offsets.top) * 10 - DreameMapParser.HALF_INT16,

                vZ.iterations,
                1, //fanSpeed. TODO Take current one from status!
                1, //Water Pump Intensity. TODO: Take current one from status!
            ]);
        });

        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.start.siid,
                aiid: this.miot_actions.start.aiid,
                in: [
                    {
                        piid: this.miot_properties.mode.piid,
                        value: this.zoneCleaningModeId
                    },
                    {
                        piid: this.miot_properties.additionalCleanupParameters.piid,
                        value: JSON.stringify({"areas": zones})
                    }
                ]
            }
        );
    }

    /**
     * @returns {import("../../../core/capabilities/ZoneCleaningCapability").ZoneCleaningCapabilityProperties}
     */
    getProperties() {
        return {
            zoneCount: {
                min: 1,
                max: 1
            },
            iterationCount: {
                min: 1,
                max: 2
            }
        };
    }
}

module.exports = DreameZoneCleaningCapability;
