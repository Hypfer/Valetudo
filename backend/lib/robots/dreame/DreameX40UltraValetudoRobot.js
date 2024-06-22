const capabilities = require("./capabilities");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameGen4ValetudoRobot = require("./DreameGen4ValetudoRobot");

const DreameQuirkFactory = require("./DreameQuirkFactory");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const Logger = require("../../Logger");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;

class DreameX40UltraValetudoRobot extends DreameGen4ValetudoRobot {

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
                        [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM_THEN_MOP]: 3,
                    }),
                    highResolutionWaterGrades: true
                },
                options,
            )
        );

        const QuirkFactory = new DreameQuirkFactory({
            robot: this
        });

        this.registerCapability(new capabilities.DreameWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.waterGrades[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.MOP_EXPANSION.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.MOP_EXPANSION.PROPERTIES.HIGH_RES_WATER_USAGE.PIID
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
                },
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
            liftSupported: true,
            detachSupported: true
        }));


        [
            capabilities.DreameCarpetModeControlCapability,
            capabilities.DreameKeyLockCapability,
            capabilities.DreameAutoEmptyDockAutoEmptyControlCapability,
            capabilities.DreameAutoEmptyDockManualTriggerCapability,
            capabilities.DreameMopDockCleanManualTriggerCapability,
            capabilities.DreameMopDockDryManualTriggerCapability,
            capabilities.DreameAICameraGoToLocationCapability,
            capabilities.DreameAICameraLineLaserObstacleAvoidanceControlCapability,
            capabilities.DreamePetObstacleAvoidanceControlCapability,
            capabilities.DreameCollisionAvoidantNavigationControlCapability,
            capabilities.DreameAutoEmptyDockAutoEmptyIntervalControlCapabilityV2
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.CARPET_MODE_SENSITIVITY),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DRYING_TIME),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_DETERGENT),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WET_DRY_SWITCH),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_AUTO_REPAIR_TRIGGER),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_AUTO_DRYING),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.DRAIN_INTERNAL_WATER_TANK),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING_V2),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING_TWIST),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING_FURNITURE_LEGS),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_HIGH_RES_WATER_HEATER),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.CARPET_DETECTION_AUTO_DEEP_CLEANING),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WATER_USAGE),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.SIDE_BRUSH_EXTEND),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.EDGE_EXTENSION_FREQUENCY),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.CAMERA_LIGHT),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.DETACH_MOPS),
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

    parseAndUpdateState(data) {
        if (!Array.isArray(data)) {
            Logger.error("Received non-array state", data);
            return;
        }

        // Filter out everything that might confuse the regular state parsing
        return super.parseAndUpdateState(data.filter(e => {
            return (
                !(
                    e.siid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID &&
                    e.piid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
                )
            );
        }));
    }

    getStatePropertiesToPoll() {
        const superProps = super.getStatePropertiesToPoll();

        return [
            ...superProps.filter(e => {
                return !(
                    e.siid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID &&
                    e.piid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
                );
            }),

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
        return "X40 Ultra";
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

        return [
            "dreame.vacuum.r2416c", // US X40 Ultra
            "dreame.vacuum.r2416a", // EU X40 Ultra
            "dreame.vacuum.r2449a", // EU X40 Ultra Complete White
            "dreame.vacuum.r2449k"  // EU X40 Ultra Complete Black
        ].includes(deviceConf?.model);
    }
}


module.exports = DreameX40UltraValetudoRobot;
