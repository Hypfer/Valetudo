const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const capabilities = require("./capabilities");
const entities = require("../../entities");


class RoborockS4VacuumRobot extends RoborockValetudoRobot {
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
        this.registerCapability(new capabilities.RoborockPersistentMapControlCapability({
            robot: this
        }));
    }


    getModelName() {
        return "S4";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === (deviceConf.model === "roborock.vacuum.s4" || deviceConf.model === "roborock.vacuum.t4"));
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW]: 101,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM]: 102,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH]: 103,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX]: 104,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.OFF] : 105 //also known as mop mode
};

module.exports = RoborockS4VacuumRobot;