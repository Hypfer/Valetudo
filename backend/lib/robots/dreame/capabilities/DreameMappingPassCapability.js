const DreameMiotServices = require("../DreameMiotServices");
const MappingPassCapability = require("../../../core/capabilities/MappingPassCapability");

/**
 * @extends MappingPassCapability<import("../DreameValetudoRobot")>
 */
class DreameMappingPassCapability extends MappingPassCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.miot_actions = {
            start: {
                siid: DreameMiotServices["GEN2"].VACUUM_2.SIID,
                aiid: DreameMiotServices["GEN2"].VACUUM_2.ACTIONS.START.AIID
            }
        };
        this.miot_properties = {
            mode: {
                piid: DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MODE.PIID
            }
        };

        this.mappingModeId = 21;
    }

    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        await this.robot.miotHelper.executeAction(
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
