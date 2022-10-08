const DreameD9ValetudoRobot = require("./DreameD9ValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const fs = require("fs");
const MiioValetudoRobot = require("../MiioValetudoRobot");

/**
 *  There is no such thing as a D9 Pro+
 *  This implementation is used by D9 Pros that use a backported D9 firmware
 */
class DreameD9ProPlusValetudoRobot extends DreameD9ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);
    }

    getModelName() {
        return "D9 Pro+";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);
        const isD9Pro = !!(deviceConf && deviceConf.model === "dreame.vacuum.p2187");

        return isD9Pro && fs.existsSync("/etc/dustbuilder_backport");
    }
}


module.exports = DreameD9ProPlusValetudoRobot;
