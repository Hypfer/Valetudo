const DreameMapParser = require("../DreameMapParser");
const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");

const DreameMiotHelper = require("../DreameMiotHelper");

/**
 * @extends GoToLocationCapability<import("../DreameValetudoRobot")>
 */
class DreameAICameraGoToLocationCapability extends GoToLocationCapability {
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
     * @param {object} options.miot_properties.additionalCleanupParameters
     * @param {number} options.miot_properties.additionalCleanupParameters.piid
     *
     * @param {number} options.goToModeId
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;

        this.goToModeId = options.goToModeId;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }


    /**
     * @param {import("../../../entities/core/ValetudoGoToLocation")} valetudoGoToLocation
     * @returns {Promise<void>}
     */
    async goTo(valetudoGoToLocation) {
        const dreamePoint = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(valetudoGoToLocation.coordinates.x, valetudoGoToLocation.coordinates.y);

        await this.helper.executeAction(
            this.miot_actions.start.siid,
            this.miot_actions.start.aiid,
            [
                {
                    piid: this.miot_properties.mode.piid,
                    value: this.goToModeId
                },
                {
                    piid: this.miot_properties.additionalCleanupParameters.piid,
                    value: JSON.stringify({"tpoint": [[dreamePoint.x, dreamePoint.y, 0, 0]]})
                }
            ]
        );
    }
}

module.exports = DreameAICameraGoToLocationCapability;
