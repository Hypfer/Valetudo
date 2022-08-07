const capabilities = require("./capabilities");
const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameQuirkFactory = require("./DreameQuirkFactory");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

class DreameZ10ProValetudoRobot extends DreameGen2LidarValetudoRobot {

    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);

        const QuirkFactory = new DreameQuirkFactory({
            robot: this
        });

        this.registerCapability(new capabilities.DreameCarpetModeControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.CARPET_MODE.PIID
        }));

        this.registerCapability(new capabilities.DreameWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(DreameValetudoRobot.WATER_GRADES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: DreameValetudoRobot.WATER_GRADES[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
        }));

        this.registerCapability(new capabilities.DreameConsumableMonitoringCapability({
            robot: this,
            miot_properties: {
                main_brush: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.MAIN_BRUSH.SIID,
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.MAIN_BRUSH.PROPERTIES.TIME_LEFT.PIID
                },
                side_brush: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.SIDE_BRUSH.SIID,
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.SIDE_BRUSH.PROPERTIES.TIME_LEFT.PIID
                },
                filter: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.FILTER.SIID,
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.FILTER.PROPERTIES.TIME_LEFT.PIID
                },
                sensor: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.SENSOR.SIID,
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.SENSOR.PROPERTIES.TIME_LEFT.PIID
                }
            },
            miot_actions: {
                reset_main_brush: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.MAIN_BRUSH.SIID,
                    aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.MAIN_BRUSH.ACTIONS.RESET.AIID
                },
                reset_side_brush: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.SIDE_BRUSH.SIID,
                    aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.SIDE_BRUSH.ACTIONS.RESET.AIID
                },
                reset_filter: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.FILTER.SIID,
                    aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.FILTER.ACTIONS.RESET.AIID
                },
                reset_sensor: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.SENSOR.SIID,
                    aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.SENSOR.ACTIONS.RESET.AIID
                }
            },
        }));

        this.registerCapability(new capabilities.DreameKeyLockCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.KEY_LOCK.PIID
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

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.CARPET_MODE_SENSITIVITY),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.TIGHT_MOP_PATTERN),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_INTERVAL),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.OBSTACLE_AVOIDANCE)
            ]
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.WATERTANK,
            attached: false
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
