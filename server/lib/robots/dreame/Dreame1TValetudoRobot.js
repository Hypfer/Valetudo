const DreameGen2VSlamValetudoRobot = require("./DreameGen2VSlamValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class Dreame1TValetudoRobot extends DreameGen2VSlamValetudoRobot {
    getModelName() {
        return "1T";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && (deviceConf.model === "dreame.vacuum.p2041" || deviceConf.model === "dreame.vacuum.p2041o"));
    }
}


module.exports = Dreame1TValetudoRobot;
