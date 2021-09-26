const {AutoEmptyDockAutoEmptyControlCapability} = require("../../../core/capabilities");

/**
 * @extends AutoEmptyDockAutoEmptyControlCapability<import("../MockRobot")>
 */
class MockAutoEmptyDockAutoEmptyControlCapability extends AutoEmptyDockAutoEmptyControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
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

module.exports = MockAutoEmptyDockAutoEmptyControlCapability;
