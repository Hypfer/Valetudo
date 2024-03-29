const CarpetSensorModeControlCapability = require("../../../core/capabilities/CarpetSensorModeControlCapability");

/**
 * @extends CarpetSensorModeControlCapability<import("../MockRobot")>
 */
class MockCarpetSensorModeControlCapability extends CarpetSensorModeControlCapability {

    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.mode = CarpetSensorModeControlCapability.MODE.LIFT;
    }

    async getMode() {
        return this.mode;
    }

    async setMode(newMode) {
        this.mode = newMode;
    }

    getProperties() {
        return {
            supportedModes: [
                CarpetSensorModeControlCapability.MODE.LIFT,
                CarpetSensorModeControlCapability.MODE.AVOID,
                CarpetSensorModeControlCapability.MODE.OFF,
            ]
        };
    }
}

module.exports = MockCarpetSensorModeControlCapability;
