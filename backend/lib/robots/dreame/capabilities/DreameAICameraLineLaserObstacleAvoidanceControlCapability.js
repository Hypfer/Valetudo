const DreameAICameraObstacleAvoidanceControlCapability = require("./DreameAICameraObstacleAvoidanceControlCapability");
const DreameLineLaserObstacleAvoidanceControlCapability = require("./DreameLineLaserObstacleAvoidanceControlCapability");
const ObstacleAvoidanceControlCapability = require("../../../core/capabilities/ObstacleAvoidanceControlCapability");

/**
 * @extends ObstacleAvoidanceControlCapability<import("../DreameValetudoRobot")>
 */
class DreameAICameraLineLaserObstacleAvoidanceControlCapability extends ObstacleAvoidanceControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.lineLaserCapability = new DreameLineLaserObstacleAvoidanceControlCapability(options);
        this.aiCameraCapability = new DreameAICameraObstacleAvoidanceControlCapability(options);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const [
            lineLaserEnabled,
            aiCameraEnabled
        ] = await Promise.all([
            this.lineLaserCapability.isEnabled(),
            this.aiCameraCapability.isEnabled()
        ]);

        return lineLaserEnabled && aiCameraEnabled;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await Promise.all([
            this.lineLaserCapability.enable(),
            this.aiCameraCapability.enable()
        ]);
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await Promise.all([
            this.lineLaserCapability.disable(),
            this.aiCameraCapability.disable()
        ]);
    }
}

module.exports = DreameAICameraLineLaserObstacleAvoidanceControlCapability;
