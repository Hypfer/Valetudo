const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class DreameD9ProValetudoRobot extends DreameGen2LidarValetudoRobot {
    getModelName() {
        return "D9 Pro";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2187");
    }
}


module.exports = DreameD9ProValetudoRobot;
