const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const capabilities = require("./capabilities");
const entities = require("../../entities");

class RoborockS5MaxValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(Object.assign({}, options, {fanSpeeds: FAN_SPEEDS}));

        this.registerCapability(new capabilities.RoborockMapSnapshotCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockCombinedVirtualRestrictionsCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMultiMapPersistentMapControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentationCapability({
            robot: this
        }));
    }

    getModelName() {
        return "S5 Max";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.s5e");
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.IntensityStateAttribute.VALUE.LOW]: 101,
    [entities.state.attributes.IntensityStateAttribute.VALUE.MEDIUM]: 102,
    [entities.state.attributes.IntensityStateAttribute.VALUE.HIGH]: 103,
    [entities.state.attributes.IntensityStateAttribute.VALUE.MAX]: 104,
    [entities.state.attributes.IntensityStateAttribute.VALUE.OFF] : 105 //also known as mop mode
};

module.exports = RoborockS5MaxValetudoRobot;
