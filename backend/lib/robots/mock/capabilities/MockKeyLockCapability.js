const KeyLockCapability = require("../../../core/capabilities/KeyLockCapability");

/**
 * @extends KeyLockCapability<import("../MockValetudoRobot")>
 */
class MockKeyLockCapability extends KeyLockCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.enabled = false;
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

module.exports = MockKeyLockCapability;
