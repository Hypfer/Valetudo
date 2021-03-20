const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");

const entities = require("../../entities");

class DreameD9ValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        //Looks like this is always enabled for LIDAR robots but a toggle for vSlam ones?
        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.PersistentMapSettingStateAttribute({
            value: entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED
        }));
    }
    getModelName() {
        return "D9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}


module.exports = DreameD9ValetudoRobot;
