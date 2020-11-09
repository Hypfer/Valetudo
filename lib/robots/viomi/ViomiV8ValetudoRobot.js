const ViomiValetudoRobot = require("./ViomiValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const entities = require("../../entities");



class ViomiV8ValetudoRobot extends ViomiValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(Object.assign({}, options, {fanSpeeds: FAN_SPEEDS}));

        // TODO: register capabilities
    }

    getModelName() {
        return "Xiaomi Mijia STYTJ02YM";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(ViomiValetudoRobot.DEVICE_CONF_PATH);
        return !!(deviceConf && deviceConf.model === "viomi.vacuum.v8");
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MIN]: 1,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW]: 38,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM]: 60,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH]: 75,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX]: 100
};

module.exports = ViomiV8ValetudoRobot;