const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");

const capabilities = require("./capabilities");

class DreameGen2VSlamValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        //Looks like this is always enabled for LIDAR robots but a toggle for vSlam ones?
        this.registerCapability(new capabilities.DreamePersistentMapControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.PERSISTENT_MAPS.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.PERSISTENT_MAPS.PROPERTIES.ENABLED.PIID
        }));
    }
}


module.exports = DreameGen2VSlamValetudoRobot;
