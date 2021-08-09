const DreameMiotHelper = require("../DreameMiotHelper");
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

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        await this.helper.executeAction(
            this.miot_actions.start.siid,
            this.miot_actions.start.aiid,
            [
                {
                    piid: this.miot_properties.mode.piid,
                    value: this.mappingModeId
                }
            ]
        );
    }
}

module.exports = DreameMappingPassCapability;
