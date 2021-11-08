const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @param {object} options
     * @param {import("../ViomiValetudoRobot")} options.robot
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
        // TODO: test
        await this.robot.sendCommand("set_remember", [1], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        // TODO: test
        await this.robot.sendCommand("set_remember", [0], {});
    }
}

module.exports = ViomiPersistentMapControlCapability;
