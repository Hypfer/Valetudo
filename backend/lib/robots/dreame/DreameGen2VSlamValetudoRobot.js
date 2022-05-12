const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");

const capabilities = require("./capabilities");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");


class DreameGen2VSlamValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        //Looks like this is always enabled for LIDAR robots but a toggle for vSlam ones?
        this.registerCapability(new capabilities.DreamePersistentMapControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.PERSISTENT_MAPS.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.PERSISTENT_MAPS.PROPERTIES.ENABLED.PIID
        }));

        this.registerCapability(new capabilities.DreameWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(DreameValetudoRobot.WATER_GRADES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: DreameValetudoRobot.WATER_GRADES[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
        }));

        this.registerCapability(new capabilities.DreameCarpetModeControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.CARPET_MODE.PIID
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.WATERTANK,
            attached: false
        }));
    }
}


module.exports = DreameGen2VSlamValetudoRobot;
