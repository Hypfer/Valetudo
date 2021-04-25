const DreameGen2VSlamValetudoRobot = require("./DreameGen2VSlamValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class DreameMovaZ500ValetudoRobot extends DreameGen2VSlamValetudoRobot {
    getModelName() {
        return "MOVA Z500";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2156o");
    }
}


module.exports = DreameMovaZ500ValetudoRobot;
