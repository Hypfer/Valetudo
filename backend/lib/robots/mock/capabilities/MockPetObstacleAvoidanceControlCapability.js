const PetObstacleAvoidanceControlCapability = require("../../../core/capabilities/PetObstacleAvoidanceControlCapability");

/**
 * @extends PetObstacleAvoidanceControlCapability<import("../MockValetudoRobot")>
 */
class MockPetObstacleAvoidanceControlCapability extends PetObstacleAvoidanceControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.enabled = true;
    }

    async isEnabled() {
        return this.enabled;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        this.enabled = true;
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        this.enabled = false;
    }
}

module.exports = MockPetObstacleAvoidanceControlCapability;
