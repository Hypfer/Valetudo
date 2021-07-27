const MappingPassCapability = require("../../../core/capabilities/MappingPassCapability");

/**
 * @extends MappingPassCapability<import("../DreameValetudoRobot")>
 */
class DreameMappingPassCapability extends MappingPassCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.start
     * @param {number} options.miot_actions.start.siid
     * @param {number} options.miot_actions.start.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mode
     * @param {object} options.miot_properties.mode.piid
     *
     * @param {number} options.mappingModeId
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;

        this.mappingModeId = options.mappingModeId;
    }

    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.start.siid,
                aiid: this.miot_actions.start.aiid,
                in: [
                    {
                        piid: this.miot_properties.mode.piid,
                        value: this.mappingModeId
                    }
                ]
            }
        );

        if (res.code !== 0) {
            throw new Error("Error code " + res.code);
        }
    }
}

module.exports = DreameMappingPassCapability;
