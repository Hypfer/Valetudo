const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const PetObstacleAvoidanceControlCapability = require("../../../core/capabilities/PetObstacleAvoidanceControlCapability");

/**
 * @extends PetObstacleAvoidanceControlCapability<import("../DreameValetudoRobot")>
 */
class DreamePetObstacleAvoidanceControlCapability extends PetObstacleAvoidanceControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        /*
            The AI_CAMERA_SETTINGS PIID actually contains a list of flags each as one bit
            I haven't figured out what all of those mean just yet.
            
            For now, we'll just hardcode 0b11111 and 0b01111
         */
        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.AI_CAMERA_SETTINGS.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        return !!(res & 0b10000);
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.helper.writeProperty(this.siid, this.piid, 0b11111);
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.helper.writeProperty(this.siid, this.piid, 0b01111);
    }
}

module.exports = DreamePetObstacleAvoidanceControlCapability;
