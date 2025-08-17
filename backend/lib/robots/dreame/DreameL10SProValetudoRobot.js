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

class DreameL10SProValetudoRobot extends DreameGen2LidarValetudoRobot {

    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(
            Object.assign(
                {},
                {
                    operationModes: Object.freeze({
                        [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM_AND_MOP]: 0,
                        [stateAttrs.PresetSelectionStateAttribute.MODE.MOP]: 1,
                        [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM]: 2,
                    }),
                    detailedAttachmentReport: true,
                },
                options,
            )
        );

        this.registerCapability(new capabilities.DreameMapSegmentationCapability({
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
            segmentCleaningModeId: 18,
            iterationsSupported: 4,
            customOrderSupported: true
        }));


        const quirkFactory = new DreameQuirkFactory({
            robot: this
        });

        this.registerCapability(new capabilities.DreameWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.waterGrades[k]});
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

        this.registerCapability(new capabilities.DreameOperationModeControlCapability({
            robot: this,
            presets: Object.keys(this.operationModes).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.operationModes[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
        }));

        this.registerCapability(new capabilities.DreameCarpetSensorModeControlCapability({
            robot: this,
            liftSupported: true
        }));


        [
            capabilities.DreameCarpetModeControlCapability,
            capabilities.DreameKeyLockCapability,
            capabilities.DreameLineLaserObstacleAvoidanceControlCapability
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.CARPET_MODE_SENSITIVITY),
                quirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.TIGHT_MOP_PATTERN),
            ]
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
        }));
    }

    getStatePropertiesToPoll() {
        const superProps = super.getStatePropertiesToPoll();

        return [
            ...superProps,
            {
                siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_STATUS.PIID
            },
            {
                siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
            }
        ];
    }


    getModelName() {
        return "L10S Pro";
    }

    getCloudSecretFromFS() {
        return fs.readFileSync("/mnt/private/ULI/factory/key.txt");
    }


    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.r2216o");
    }
}


module.exports = DreameL10SProValetudoRobot;
