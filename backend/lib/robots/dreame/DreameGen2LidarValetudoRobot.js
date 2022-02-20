const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");

const capabilities = require("./capabilities");

class DreameGen2LidarValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        this.registerCapability(new capabilities.DreameMappingPassCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.ACTIONS.START.AIID
                }
            },
            miot_properties: {
                mode: {
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID
                }
            },
            mappingModeId: 21
        }));
    }
}


module.exports = DreameGen2LidarValetudoRobot;
