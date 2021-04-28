const ManualControlCapability = require("../../core/capabilities/ManualControlCapability");
const stateAttrs = require("../../entities/state/attributes");
const ValetudoSensor = require("../../entities/core/ValetudoSensor");

// Common Viomi enums

/** @enum {number} */
const ViomiOperationMode = Object.freeze({
    VACUUM: 0,
    MIXED: 1,
    MOP: 2,
});

/** @enum {number} */
const ViomiBoxType = Object.freeze({
    NONE: 0,
    VACUUM: 1,
    WATER: 2,
    VACUUM_AND_WATER: 3
});

/** @enum {number} */
const ViomiOperation = Object.freeze({
    STOP: 0,
    START: 1,
    PAUSE: 2,
    PAUSE_RECTANGULAR_ZONE: 3
});

/** @enum {number} */
const ViomiArea = Object.freeze({
    NORMAL: 0,
    RESTRICTED: 2
});

/** @enum {number} */
const ViomiMovementMode = Object.freeze({
    NORMAL_CLEANING: 0, // goes in straight lines with vacuum motor on
    VACUUM_AND_MOP: 1,  // back and forth mopping movement with vacuum motor on
    OUTLINE: 2,         // only clean the rooms outline
    MOP_NO_VACUUM: 3,   // same as VACUUM_AND_MOP, but the vacuum motor is turned off
});

const ViomiZoneCleaningCommand = Object.freeze({
    STOP: 0,
    CLEAN_ZONE: 3
});

const ViomiSensorTypes = Object.freeze([
    new ValetudoSensor({
        type: ValetudoSensor.TYPE.ACCELEROMETER,
        value: null,
    }),
]);

const ViomiManualControlDirection = Object.freeze({
    [ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD]: 1,
    [ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE]: 2,
    [ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE]: 3,
    [ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD]: 4,
    //STOP: 5, //TODO
    ENTER_EXIT: 10,
});

const FAN_SPEEDS = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.VALUE.LOW]: 0,
    [stateAttrs.PresetSelectionStateAttribute.VALUE.MEDIUM]: 1,
    [stateAttrs.PresetSelectionStateAttribute.VALUE.HIGH]: 2,
    [stateAttrs.PresetSelectionStateAttribute.VALUE.MAX]: 3
});

const WATER_GRADES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.VALUE.LOW]: 11,
    [stateAttrs.PresetSelectionStateAttribute.VALUE.MEDIUM]: 12,
    [stateAttrs.PresetSelectionStateAttribute.VALUE.HIGH]: 13,
});

module.exports = {
    ViomiBoxType: ViomiBoxType,
    ViomiArea: ViomiArea,
    ViomiOperationMode: ViomiOperationMode,
    ViomiOperation: ViomiOperation,
    ViomiManualControlDirection: ViomiManualControlDirection,
    ViomiMovementMode: ViomiMovementMode,
    ViomiZoneCleaningCommand: ViomiZoneCleaningCommand,
    ViomiSensorTypes: ViomiSensorTypes,
    FAN_SPEEDS: FAN_SPEEDS,
    WATER_GRADES: WATER_GRADES
};
