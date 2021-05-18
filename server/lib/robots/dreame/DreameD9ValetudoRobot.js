const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class DreameD9ValetudoRobot extends DreameGen2LidarValetudoRobot {
    getModelName() {
        return "D9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}


module.exports = DreameD9ValetudoRobot;
