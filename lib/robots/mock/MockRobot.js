const capabilities = require("./capabilities");
const ValetudoRobot = require("../../core/ValetudoRobot");

class MockRobot extends ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(options);

        this.registerCapability(new capabilities.MockBasicControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockCarpetModeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockFanSpeedControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockLocateCapability({robot: this}));
    }

    getManufacturer() {
        return "Valetudo";
    }

    getModelName() {
        return "MockRobot";
    }
}

module.exports = MockRobot;
