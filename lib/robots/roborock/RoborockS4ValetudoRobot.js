const capabilities = require("./capabilities");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");


class RoborockS4ValetudoRobot extends RoborockValetudoRobot {
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
        this.registerCapability(new capabilities.RoborockMapResetCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentationCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentEditCapability({
            robot: this
        }));
    }


    getModelName() {
        return "S4";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && (deviceConf.model === "roborock.vacuum.s4" || deviceConf.model === "roborock.vacuum.t4"));
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.IntensityStateAttribute.VALUE.LOW]: 101,
    [entities.state.attributes.IntensityStateAttribute.VALUE.MEDIUM]: 102,
    [entities.state.attributes.IntensityStateAttribute.VALUE.HIGH]: 103,
    [entities.state.attributes.IntensityStateAttribute.VALUE.MAX]: 104,
    [entities.state.attributes.IntensityStateAttribute.VALUE.OFF] : 105 //also known as mop mode
};

module.exports = RoborockS4ValetudoRobot;
