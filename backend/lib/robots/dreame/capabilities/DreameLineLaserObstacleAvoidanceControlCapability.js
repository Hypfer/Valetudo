const DreameMiotServices = require("../DreameMiotServices");
const ObstacleAvoidanceControlCapability = require("../../../core/capabilities/ObstacleAvoidanceControlCapability");

/**
 * @extends ObstacleAvoidanceControlCapability<import("../DreameValetudoRobot")>
 */
class DreameLineLaserObstacleAvoidanceControlCapability extends ObstacleAvoidanceControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.OBSTACLE_AVOIDANCE.PIID;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.miotHelper.readProperty(this.siid, this.piid);

        return res === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.miotHelper.writeProperty(this.siid, this.piid, 1);
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.miotHelper.writeProperty(this.siid, this.piid, 0);
    }
}

module.exports = DreameLineLaserObstacleAvoidanceControlCapability;
