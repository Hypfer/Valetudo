const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const entities = require("../../../entities");
const MopDockDryManualTriggerCapability = require("../../../core/capabilities/MopDockDryManualTriggerCapability");

/**
 * @extends MopDockDryManualTriggerCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockDryManualTriggerCapability extends MopDockDryManualTriggerCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot 
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.aiid = DreameMiotServices["GEN2"].VACUUM_2.ACTIONS.MOP_DOCK_INTERACT.AIID;
        this.additionalCleanupParametersPiid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async startDrying() {
        const StatusStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.StatusStateAttribute.name,
        });
        const DockStatusStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.DockStatusStateAttribute.name,
        });

        if (
            StatusStateAttribute?.value === entities.state.attributes.StatusStateAttribute.VALUE.DOCKED &&
            DockStatusStateAttribute?.value === entities.state.attributes.DockStatusStateAttribute.VALUE.PAUSE
        ) {
            await this.getBasicControlCapability().stop();
        }

        await this.helper.executeAction(
            this.siid,
            this.aiid,
            [
                {
                    piid: this.additionalCleanupParametersPiid,
                    value: "3,1"
                }
            ]
        );
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async stopDrying() {
        await this.helper.executeAction(
            this.siid,
            this.aiid,
            [
                {
                    piid: this.additionalCleanupParametersPiid,
                    value: "3,0"
                }
            ]
        );

        await this.getBasicControlCapability().stop();
    }

    /**
     * @private
     * @returns {import("./DreameBasicControlCapability")}
     */
    getBasicControlCapability() {
        return this.robot.capabilities[BasicControlCapability.TYPE];
    }
}

module.exports = DreameMopDockDryManualTriggerCapability;
