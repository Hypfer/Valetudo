const DreameGen2VSlamValetudoRobot = require("./DreameGen2VSlamValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class DreameF9ValetudoRobot extends DreameGen2VSlamValetudoRobot {
    getModelName() {
        return "F9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2008");
    }
}


module.exports = DreameF9ValetudoRobot;
