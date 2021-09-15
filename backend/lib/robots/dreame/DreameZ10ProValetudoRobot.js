const capabilities = require("./capabilities");
const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

class DreameZ10ProValetudoRobot extends DreameGen2LidarValetudoRobot {

    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);

        this.registerCapability(new capabilities.DreameObstacleAvoidanceControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.OBSTACLE_AVOIDANCE.PIID
        }));

        this.registerCapability(new capabilities.DreameAutoEmptyDockAutoEmptyControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.AUTO_EMPTY_DOCK.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.AUTO_EMPTY_DOCK.PROPERTIES.AUTO_EMPTY_ENABLED.PIID
        }));

        this.registerCapability(new capabilities.DreameAutoEmptyDockManualTriggerCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.AUTO_EMPTY_DOCK.SIID,
            aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.AUTO_EMPTY_DOCK.ACTIONS.EMPTY_DUSTBIN.AIID
        }));
    }


    getModelName() {
        return "Z10 Pro";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2028");
    }
}


module.exports = DreameZ10ProValetudoRobot;
