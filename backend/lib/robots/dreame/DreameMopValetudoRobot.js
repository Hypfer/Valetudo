const capabilities = require("./capabilities");
const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
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

class DreameMopValetudoRobot extends DreameGen2LidarValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);

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
            zoneCleaningModeId: 19
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

        this.registerCapability(new capabilities.DreameMopDockWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(WATER_GRADES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: WATER_GRADES[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
        }));

        this.registerCapability(new capabilities.DreameMopDockCleanManualTriggerCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.ACTIONS.MOP_DOCK_INTERACT.AIID,

            additionalCleanupParametersPiid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
        }));

        this.registerCapability(new capabilities.DreameMopDockDryManualTriggerCapability({
            robot: this,
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            aiid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.ACTIONS.MOP_DOCK_INTERACT.AIID,

            additionalCleanupParametersPiid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
        }));

        this.registerCapability(new capabilities.DreameOperationModeControlCapability({
            robot: this,
            presets: Object.keys(this.operationModes).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.operationModes[k]});
            }),
            siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
            piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
        }));


        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
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
            },
            {
                siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_STATUS.PIID
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
}


module.exports = DreameMopValetudoRobot;
