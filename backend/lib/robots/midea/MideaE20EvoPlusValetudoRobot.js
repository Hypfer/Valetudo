const BEightParser = require("../../msmart/BEightParser");
const capabilities = require("./capabilities");
const dtos = require("../../msmart/dtos");
const entities = require("../../entities");
const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaQuirkFactory = require("./MideaQuirkFactory");
const MideaValetudoRobot = require("./MideaValetudoRobot");
const MSmartConst = require("../../msmart/MSmartConst");
const MSmartPacket = require("../../msmart/MSmartPacket");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const ValetudoRobotError = require("../../entities/core/ValetudoRobotError");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;

class MideaE20EvoPlusValetudoRobot extends MideaValetudoRobot {
    constructor(options) {
        super(
            Object.assign(
                {},
                options,
                {
                    fanSpeeds: FAN_SPEEDS,
                    waterGrades: WATER_GRADES,
                    statusMap: STATUS_MAP
                }
            )
        );

        const quirkFactory = new MideaQuirkFactory({
            robot: this
        });

        this.registerCapability(new capabilities.MideaFanSpeedControlCapabilityV1({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.fanSpeeds[k]});
            })
        }));
        this.registerCapability(new capabilities.MideaOperationModeControlCapabilityV1({
            robot: this,
            presets: Object.keys(OPERATION_MODES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: OPERATION_MODES[k]});
            })
        }));
        this.registerCapability(new capabilities.MideaWaterUsageControlCapabilityV1({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.waterGrades[k]});
            })
        }));

        [
            capabilities.MideaBasicControlCapabilityV1,
            capabilities.MideaCarpetModeControlCapabilityV1,
            capabilities.MideaCombinedVirtualRestrictionsCapabilityV1,
            capabilities.MideaDoNotDisturbCapabilityV1,
            capabilities.MideaKeyLockCapabilityV1,
            capabilities.MideaLocateCapabilityV1,
            capabilities.MideaMapSegmentEditCapabilityV1,
            capabilities.MideaMapSegmentationCapabilityV1,
            capabilities.MideaSpeakerVolumeControlCapabilityV1,
            capabilities.MideaZoneCleaningCapabilityV1,
            capabilities.MideaMappingPassCapabilityV1,
            capabilities.MideaMapResetCapabilityV1,
            capabilities.MideaAutoEmptyDockManualTriggerCapabilityV1,
            capabilities.MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV1,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.LEGACY_AUTO_EMPTY_DURATION),
            ]
        }));
    }

    async pollState() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_ONE,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_ONE_ACTION_SUBCOMMAND.POLL_STATUS
                ])
            )
        });

        const response = await this.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof dtos.MSmartStatusDTO) {
            this.parseAndUpdateState(parsedResponse);
        }

        return this.state;
    }

    async executeMapPoll() {
        // TODO: Should these all be new instances every single poll?
        const mapPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.MAP_MANAGEMENT,
                    0x04, // poll map
                    0x01 // map ID (current?)
                ])
            )
        });
        const dockPositionPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_TWO,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_TWO_ACTION_SUBCOMMAND.GET_DOCK_POSITION
                ])
            )
        });
        const activeZonesPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_TWO,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_TWO_ACTION_SUBCOMMAND.GET_ACTIVE_ZONES
                ])
            )
        });

        await this.sendCommand(mapPollPacket.toHexString());

        const dockPositionResponse = await this.sendCommand(dockPositionPollPacket.toHexString());

        await this.mapParser.update("dockPosition", {
            x: dockPositionResponse.payload.readUInt16BE(2), // BE for some reason
            y: dockPositionResponse.payload.readUInt16BE(4),
            angle: 0 // wrong but doesn't hurt
        });

        const activeZonesResponse = await this.sendCommand(activeZonesPollPacket.toHexString());
        const parsedActiveZonesResponse = BEightParser.PARSE(activeZonesResponse);

        if (parsedActiveZonesResponse instanceof dtos.MSmartActiveZonesDTO) {
            await this.mapParser.update("evt_active_zones", parsedActiveZonesResponse);
        }
    }

    /**
     * @param {import("../../msmart/dtos/MSmartStatusDTO")} data
     */
    parseAndUpdateState(data) {
        if (data.elevator_switch !== undefined) {
            let matchingOperationMode = Object.keys(OPERATION_MODES).find(key => {
                return OPERATION_MODES[key] === data.elevator_switch;
            });

            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                type: stateAttrs.PresetSelectionStateAttribute.TYPE.OPERATION_MODE,
                value: matchingOperationMode,
                metaData: {
                    rawValue: data.elevator_switch
                },
            }));
        }

        super.parseAndUpdateState({...data, mopMode: undefined}); //Filtered for good measure
    }

    /**
     *
     * @param {number} errorType - Error category (1=solvable, 2=restart, 3=warning/alert)
     * @param {number} errorDesc - Specific error code within the category
     *
     * @returns {ValetudoRobotError}
     */
    mapErrorCode(errorType, errorDesc) { // TODO: review these by hand
        const vendorErrorCode = `${errorType}-${errorDesc}`;
        const parameters = {
            severity: {
                kind: ValetudoRobotError.SEVERITY_KIND.UNKNOWN,
                level: ValetudoRobotError.SEVERITY_LEVEL.UNKNOWN,
            },
            subsystem: ValetudoRobotError.SUBSYSTEM.UNKNOWN,
            message: `Unknown error ${vendorErrorCode}`,
            vendorErrorCode: vendorErrorCode
        };

        if (errorType === 1) { // Solvable errors
            switch (errorDesc) {
                case 1: // DUST_BOX_MISSING
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                    parameters.message = "Dustbin missing";
                    break;
                case 2: // WHEELS_DANGLING
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                    parameters.message = "Wheel lost floor contact";
                    break;
                case 3: // WHEELS_OVERLOAD
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                    parameters.message = "Wheel jammed";
                    break;
                case 4: // SIDE_BRUSH_FAULT
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                    parameters.message = "Side brush jammed";
                    break;
                case 5: // ROLLING_BRUSH_FAULT
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                    parameters.message = "Main brush jammed";
                    break;
                case 6: // DUST_MOTOR_OVERLOAD
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                    parameters.message = "Fan speed abnormal";
                    break;
                case 7: // FRONT_PANEL_FAULT
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "Stuck front bumper";
                    break;
                case 8: // RADAR_MASK
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "LDS jammed";
                    break;
                case 9: // FRONT_SENSOR_FAULT
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "Cliff sensor dirty or robot on the verge of falling";
                    break;
                case 10: // BATTERY_VERY_LOW_HIT
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                    parameters.message = "Low battery";
                    break;
                case 11: // LEAN_ERR
                case 26: // LEAN_ERR (duplicate code)
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "Tilted robot";
                    break;
                case 12: // LASER_SENSOR_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "LDS jammed";
                    break;
                case 13: // EDGE_SENSOR_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "Sensor dirty";
                    break;
                case 14: // FIND_BARRIER
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                    parameters.message = "Robot trapped by virtual restrictions";
                    break;
                case 15: // MAGNETIC_FIELD_DISTURB
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "Magnetic interference";
                    break;
                case 16: // LASER_SENSOR_BLOCK_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "LDS bumper jammed";
                    break;
                case 17: // MOP_LOSE_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                    parameters.message = "Lost mop pad";
                    break;
                case 18: // MOP_SLIP_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                    parameters.message = "Robot stuck or trapped";
                    break;
                case 19: // RECHARGE_FAIL
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                    parameters.message = "Charging station without power";
                    break;
                case 21: // STERILIZATION_MODULE_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                    parameters.message = "Sterilization module fault";
                    break;
                case 23: // DUST_COLLECTION_ERR
                case 160: // DUST_BOX_ERR (another dust collection error)
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Auto-Empty Dock dust collection error";
                    break;
                case 24: // DUST_FULL_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Auto-Empty Dock dust bag full or dust duct clogged";
                    break;
                case 25: // DUST_COMMUNICATION_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Dock communication error";
                    break;
                case 161: // BLE_CONNECT_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                    parameters.message = "Bluetooth connection error";
                    break;
            }
        } else if (errorType === 2) { // Restart errors
            switch (errorDesc) {
                case 1: // LASER_COM_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "LDS communication error";
                    break;
                case 2: // MAINFRAME_COM_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                    parameters.message = "Mainframe communication error";
                    break;
                case 3: // WATER_INTNAL_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                    parameters.message = "Internal water system error";
                    break;
            }
        } else if (errorType === 3) { // Warning/Alert errors
            switch (errorDesc) {
                case 1: // LOCATION_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                    parameters.message = "Localization error";
                    break;
                case 2: // BATTERY_LOW_HIT
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                    parameters.message = "Low battery";
                    break;
                case 3: // DUST_BOX_FULL
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                    parameters.message = "Dustbin full";
                    break;
                case 4: // WATER_BOX_LACK
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                    parameters.message = "Water tank empty";
                    break;
                case 5: // RECHARGE_FAIL
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                    parameters.message = "Charging error";
                    break;
                case 6: // SENSOR_DIRTY_MSG
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                    parameters.message = "Sensor dirty";
                    break;
                case 7: // BATTERY_TEM_MSG
                case 17: // BATTERY_TEM_MSG (duplicate code)
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                    parameters.message = "Battery temperature out of operating range";
                    break;
                case 8: // ELEVATOR_ERROR_MSG
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                    parameters.message = "Mop lift error";
                    break;
                case 9: // DUST_INTERUPT_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Auto-Empty Dock dust collection interrupted";
                    break;
                case 10: // DUST_BOX_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Auto-Empty Dock dust collection error";
                    break;
                case 11: // DUST_OPENED_ERR
                case 12: // DUST_UNINSTALL_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Auto-Empty Dock cover open or missing dust bag";
                    break;
                case 13: // DUST_FULL_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                    parameters.message = "Auto-Empty Dock dust bag full or dust duct clogged";
                    break;
                case 14: // SLIP_WARNING
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                    parameters.message = "Wheel slipping";
                    break;
                case 15: // BLE_CONNECT_ERR
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                    parameters.message = "Bluetooth connection error";
                    break;
                case 16: // CHILD_LOCK_OPENED
                    parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                    parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                    parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                    parameters.message = "Child lock enabled";
                    break;
            }
        }

        return new ValetudoRobotError(parameters);
    }

    getManufacturer() {
        return "Eureka";
    }

    getModelName() {
        return "E20 Evo Plus";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        let sn8;

        try {
            sn8 = fs.readFileSync("/oem/midea/device.sn8").toString().trim();
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", "/oem/midea/device.sn8", e);
        }

        return ["750Y0015"].includes(sn8);
    }
}

const FAN_SPEEDS = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MIN]: 4,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 3,
});

const WATER_GRADES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.OFF]: 0,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 3,
});

const OPERATION_MODES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM_AND_MOP]: true,
    [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM]: false
});

const STATUS_MAP = Object.freeze({
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE // unsure
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE // might also be docked?
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    14: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING
    },
    15: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED // maybe? Idle?
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED // TODO This should set the dock auto empty attribute status to emptying
    },
    17: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    18: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED // maybe? Idle?
    },


    22: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },

    23: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING,
        flag: stateAttrs.StatusStateAttribute.FLAG.MAPPING
    },
    24: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED,
        flag: stateAttrs.StatusStateAttribute.FLAG.RESUMABLE
    }
});




module.exports = MideaE20EvoPlusValetudoRobot;
