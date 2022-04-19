const capabilities = require("./capabilities");
const entities = require("../../entities");
const Logger = require("../../Logger");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");

// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:roborock-a19:1
const MIOT_SERVICES = Object.freeze({
    VACUUM_1: {
        SIID: 2,
        PROPERTIES: {
            STATUS: {
                PIID: 1
            },
            DEVICE_FAULT: {
                PIID: 2
            },
            MODE: {
                // the spec reports this as 4, but empirically shows up as piid 3
                PIID: 3
            }
        },
        ACTIONS: {
            START: {
                AIID: 1
            },
            STOP: {
                AIID: 2
            },
        }
    },
    VACUUM_2: {
        SIID: 8,
        PROPERTIES: {
            CONSUMABLE_ID: {
                PIID: 1
            },
            FAILED_REASON: {
                PIID: 2
            },
            ERROR_CODE: {
                PIID: 3
            }
        }
    },
    BATTERY: {
        SIID: 3,
        PROPERTIES: {
            LEVEL: {
                PIID: 1
            },
            CHARGING: {
                PIID: 2
            }
        },
        ACTIONS: {
            START_CHARGE: {
                AIID: 1
            }
        }
    },
    MAIN_BRUSH: {
        SIID: 9,
        PROPERTIES: {
            PERCENT_LEFT: {
                PIID: 2
            }
        }
    },
    SIDE_BRUSH: {
        SIID: 10,
        PROPERTIES: {
            PERCENT_LEFT: {
                PIID: 2
            }
        }
    },
    FILTER: {
        SIID: 11,
        PROPERTIES: {
            PERCENT_LEFT: {
                PIID: 2
            }
        }
    },
});

class RoborockGen4ValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {Array<import("../../entities/state/attributes/AttachmentStateAttribute").AttachmentStateAttributeType>} [options.supportedAttachments]
     */
    constructor(options) {
        super(Object.assign({}, options, {fanSpeeds: FAN_SPEEDS}));

        this.registerCapability(new capabilities.RoborockMultiMapPersistentMapControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMultiMapMapResetCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentationCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentEditCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentRenameCapability({
            robot: this
        }));
    }

    onIncomingCloudMessage(msg) {
        if (super.onIncomingCloudMessage(msg) === true) {
            return true;
        }

        switch (msg.method) {
            case "event_occured":
                msg.params.arguments.forEach(a => {
                    return this.handlePropertyChange({
                        siid: msg.params.siid,
                        piid: a.piid,
                        value: a.value
                    });
                });
                break;
            case "properties_changed":
                msg.params.forEach(e => {
                    this.handlePropertyChange(e);
                });
                break;
            default:
                return false;
        }

        this.sendCloud({id: msg.id, "result":"ok"});
        return true;
    }

    handlePropertyChange(msg) {
        switch (msg.siid) {
            case MIOT_SERVICES.VACUUM_1.SIID:
                switch (msg.piid) {
                    case MIOT_SERVICES.VACUUM_1.PROPERTIES.STATUS.PIID:
                        // if we are paused, we may lose if it is zoned or
                        // segment resume, maybe we should skip this?
                        this.parseAndUpdateState({
                            in_cleaning: 1,
                            state: msg.value,
                        });
                        return;
                    case MIOT_SERVICES.VACUUM_1.PROPERTIES.DEVICE_FAULT.PIID:
                        if (msg.value !== 0) {
                            this.parseAndUpdateState({
                                state: 12, // error value
                                error_code: msg.value
                            });
                        }
                        return;
                    case MIOT_SERVICES.VACUUM_1.PROPERTIES.MODE.PIID:
                        this.parseAndUpdateState({
                            fan_power: msg.value
                        });
                        return;
                }
                break;
            case MIOT_SERVICES.VACUUM_2.SIID:
                switch (msg.piid) {
                    // error event
                    case MIOT_SERVICES.VACUUM_2.PROPERTIES.ERROR_CODE.PIID:
                        if (msg.value !== 0) {
                            this.parseAndUpdateState({
                                state: 12, // error value
                                error_code: msg.value
                            });
                        }
                        return;
                    case MIOT_SERVICES.VACUUM_2.PROPERTIES.CONSUMABLE_ID.PIID: // consumable reminder event
                    case MIOT_SERVICES.VACUUM_2.PROPERTIES.FAILED_REASON.PIID: // schedule cancled event
                        return;
                }
                break;
            case MIOT_SERVICES.BATTERY.SIID:
                switch (msg.piid) {
                    case MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID:
                        this.parseAndUpdateState({
                            battery: msg.value
                        });
                        return;
                }
                break;
            case MIOT_SERVICES.MAIN_BRUSH.SIID:
            case MIOT_SERVICES.SIDE_BRUSH.SIID:
            case MIOT_SERVICES.FILTER.SIID:
                // the consumables only reports percent through this property, ignore
                return;
        }
        Logger.info("Unknown property change message received:", msg);
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.LOW]: 101,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 102,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.HIGH]: 103,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MAX]: 104,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.OFF] : 105 //also known as mop mode
};

module.exports = RoborockGen4ValetudoRobot;
