const ViomiValetudoRobot = require("./ViomiValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");


class ViomiV8ValetudoRobot extends ViomiValetudoRobot {
    /**
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {object} [options.fanSpeeds]
     * @param {object} [options.waterGrades]
     */
    constructor(options) {
        super(options);
        // TODO: register model-specific capabilities
    }

    getModelName() {
        return "Xiaomi Mijia STYTJ02YM";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(ViomiValetudoRobot.DEVICE_CONF_PATH);
        return !!(deviceConf && deviceConf.model === "viomi.vacuum.v8");
    }
}

module.exports = ViomiV8ValetudoRobot;
