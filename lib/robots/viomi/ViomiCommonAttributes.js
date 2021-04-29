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
    MODE_S: 0,           // goes in straight lines with vacuum motor on
    MODE_Y: 1,           // back and forth mopping movement with vacuum motor on
    OUTLINES: 2,         // only clean the rooms outline
    Y_NO_VACUUM: 3,      // same as MODE_Y, but the vacuum motor is turned off
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
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 0,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MAX]: 3
});

const WATER_GRADES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 11,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 12,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 13,
});

const MOVEMENT_MODE_PRESETS = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.AUTO]: stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.AUTO,
    [stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.MODE_S]: stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.MODE_S,
    [stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.MODE_Y]: stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.MODE_Y,
    [stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.OUTLINES]: stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.OUTLINES,
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
    WATER_GRADES: WATER_GRADES,
    MOVEMENT_MODE_PRESETS: MOVEMENT_MODE_PRESETS,
};
