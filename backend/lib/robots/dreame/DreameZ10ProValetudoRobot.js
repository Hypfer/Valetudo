const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class DreameZ10ProValetudoRobot extends DreameGen2LidarValetudoRobot {
    getModelName() {
        return "Z10 Pro";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2028");
    }
}


module.exports = DreameZ10ProValetudoRobot;
