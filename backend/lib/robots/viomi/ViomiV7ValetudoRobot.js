const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const ViomiQuirkFactory = require("./ViomiQuirkFactory");
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

        const quirkFactory = new ViomiQuirkFactory({
            robot: this
        });
        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(ViomiQuirkFactory.KNOWN_QUIRKS.BUTTON_LEDS),
                quirkFactory.getQuirk(ViomiQuirkFactory.KNOWN_QUIRKS.MOP_PATTERN)
            ]
        }));
    }

    getModelName() {
        return "V7";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(ViomiValetudoRobot.DEVICE_CONF_PATH);
        return !!(deviceConf && deviceConf.model === "viomi.vacuum.v7");
    }
}

module.exports = ViomiV7ValetudoRobot;
