const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");

class MockCarpetModeControlCapability extends CarpetModeControlCapability {
    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     */
    constructor(options) {
        super(options);

        this.enabled = false;
    }

    /**
     * This function polls the current carpet mode state
     *
     * @returns {Promise<boolean>}
     */
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

module.exports = MockCarpetModeControlCapability;
