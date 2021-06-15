const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoborockGen4ValetudoRobot = require("./RoborockGen4ValetudoRobot");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");

class RoborockS7ValetudoRobot extends RoborockGen4ValetudoRobot {
    getModelName() {
        return "S7";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && (deviceConf.model === "roborock.vacuum.a14" || deviceConf.model === "roborock.vacuum.a15"));
    }
}



module.exports = RoborockS7ValetudoRobot;
