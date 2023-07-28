const capabilities = require("./capabilities");
const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameQuirkFactory = require("./DreameQuirkFactory");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const fs = require("fs");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;

class DreameD10SPlusValetudoRobot extends DreameGen2LidarValetudoRobot {

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

        this.registerCapability(new capabilities.DreameZoneCleaningCapability({
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
                },
                additionalCleanupParameters: {
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            zoneCleaningModeId: 19,
            maxZoneCount: 4
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
                },
                mop: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.MOP.SIID,
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.MOP.PROPERTIES.TIME_LEFT.PIID
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
                },
                reset_mop: {
                    siid: DreameGen2ValetudoRobot.MIOT_SERVICES.MOP.SIID,
                    aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.MOP.ACTIONS.RESET.AIID
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

        this.registerCapability(new capabilities.DreameAICameraGoToLocationCapability({
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
                },
                additionalCleanupParameters: {
                    piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            goToModeId: 23
        }));

        this.registerCapability(new capabilities.DreameObstacleAvoidanceControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.OBSTACLE_AVOIDANCE.PIID
        }));

        this.registerCapability(new capabilities.DreamePetObstacleAvoidanceControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.AI_CAMERA_SETTINGS.PIID
        }));

        this.registerCapability(new capabilities.DreameCollisionAvoidantNavigationControlCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
        }));

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.CARPET_MODE_SENSITIVITY),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.TIGHT_MOP_PATTERN),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_INTERVAL),
            ]
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
        }));
    }

    getModelName() {
        return "D10S Plus";
    }

    getCloudSecretFromFS() {
        return fs.readFileSync("/mnt/private/ULI/factory/key.txt");
    }

    getModelDetails() {
        return Object.assign(
            {},
            super.getModelDetails(),
            {
                supportedAttachments: [
                    stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                ]
            }
        );
    }


    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.r2240");
    }
}


module.exports = DreameD10SPlusValetudoRobot;
