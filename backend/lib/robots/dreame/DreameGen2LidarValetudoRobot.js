const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const entities = require("../../entities");

class DreameGen2LidarValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        //Looks like this is always enabled for LIDAR robots but a toggle for vSlam ones?
        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.PersistentMapSettingStateAttribute({
            value: entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED
        }));
    }
}


module.exports = DreameGen2LidarValetudoRobot;
