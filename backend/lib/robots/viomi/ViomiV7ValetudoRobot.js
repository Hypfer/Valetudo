const MiioValetudoRobot = require("../MiioValetudoRobot");
const ViomiValetudoRobot = require("./ViomiValetudoRobot");


class ViomiV7ValetudoRobot extends ViomiValetudoRobot {
    /**
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {object} [options.fanSpeeds]
     * @param {object} [options.waterGrades]
     */
    constructor(options) {
        super(options);
        // TODO: register model-specific capabilities
    }

    getModelName() {
        return "Xiaomi Mi Robot Vacuum-Mop P";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(ViomiValetudoRobot.DEVICE_CONF_PATH);
        return !!(deviceConf && ["viomi.vacuum.v6", "viomi.vacuum.v7", "viomi.vacuum.v8", "viomi.vacuum.v9"].includes(deviceConf.model));
    }
}

module.exports = ViomiV7ValetudoRobot;
