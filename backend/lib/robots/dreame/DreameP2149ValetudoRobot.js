const capabilities = require("./capabilities");
const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameQuirkFactory = require("./DreameQuirkFactory");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const DreameUtils = require("./DreameUtils");
const entities = require("../../entities");
const Logger = require("../../Logger");
const stateAttrs = entities.state.attributes;

const WATER_GRADES = {
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 3,
};

class DreameP2149ValetudoRobot extends DreameGen2LidarValetudoRobot {
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

        this.registerCapability(new capabilities.DreameMopDockWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(WATER_GRADES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: WATER_GRADES[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
        }));

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_ONLY_MODE),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY),
                QuirkFactory.getQuirk(DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_UV_TREATMENT)
            ]
        }));
    }

    getStatePropertiesToPoll() {
        const superProps = super.getStatePropertiesToPoll();

        return [
            // We don't have to poll the water usage piid as it doesn't control anything on this robot
            ...superProps.filter(e => {
                return !(
                    e.siid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID &&
                   e.piid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
                );
            }),

            {
                siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
            }
        ];
    }

    parseAndUpdateState(data) {
        if (!Array.isArray(data)) {
            Logger.error("Received non-array state", data);
            return;
        }

        data.forEach(elem => {
            switch (elem.siid) {
                case DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID: {
                    switch (elem.piid) {
                        case DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID: {
                            const deserializedValue = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(elem.value);

                            let matchingWaterGrade = Object.keys(WATER_GRADES).find(key => {
                                return WATER_GRADES[key] === deserializedValue.waterGrade;
                            });

                            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                                metaData: {
                                    rawValue: elem.value
                                },
                                type: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE,
                                value: matchingWaterGrade
                            }));
                            break;
                        }
                        case DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_TANK_ATTACHMENT.PIID: {
                            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
                                type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
                                attached: elem.value === 1
                            }));
                            break;
                        }
                    }
                    break;
                }
            }
        });

        // Filter out everything that might confuse the regular state parsing
        return super.parseAndUpdateState(data.filter(e => {
            return (
                !(
                    e.siid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID &&
                    e.piid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
                ) &&
                !(
                    e.siid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID &&
                    e.piid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
                ) &&
                !(
                    e.siid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID &&
                    e.piid === DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_TANK_ATTACHMENT.PIID
                )
            );
        }));
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


    getModelName() {
        return "P2149";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2149o");
    }
}


module.exports = DreameP2149ValetudoRobot;
