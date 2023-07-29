const DreameMapParser = require("../DreameMapParser");
const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");

const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");

/**
 * @extends GoToLocationCapability<import("../DreameValetudoRobot")>
 */
class DreameAICameraGoToLocationCapability extends GoToLocationCapability {
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
            },
            additionalCleanupParameters: {
                piid: DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
            }
        };

        this.goToModeId = 23;

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
