const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

const capabilities = require("./capabilities");

class DreameF9ValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        //Looks like this is always enabled for LIDAR robots but a toggle for vSlam ones?
        this.registerCapability(new capabilities.DreamePersistentMapControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.PERSISTENT_MAPS.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.PERSISTENT_MAPS.PROPERTIES.ENABLED.PIID
        }));
    }
    getModelName() {
        return "F9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2008");
    }
}


module.exports = DreameF9ValetudoRobot;
