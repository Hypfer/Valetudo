const MiioValetudoRobot = require("../MiioValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");

class DreameD9ValetudoRobot extends DreameGen2ValetudoRobot {
    getModelName() {
        return "D9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}


module.exports = DreameD9ValetudoRobot;
