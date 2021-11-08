const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.persistentMapState = undefined;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        await this.robot.pollState(); //fetching robot state populates the capability's internal state. somewhat spaghetti :(

        return this.persistentMapState;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_lab_status", [1], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_lab_status", [0], {});
    }
}

module.exports = RoborockPersistentMapControlCapability;
