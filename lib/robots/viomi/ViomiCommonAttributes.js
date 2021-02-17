const stateAttrs = require("../../entities/state/attributes");

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
    PAUSE: 2
});

/** @enum {number} */
const ViomiArea = Object.freeze({
    NORMAL: 0,
    RESTRICTED: 2
});

/** @enum {number} */
const ViomiMovementMode = Object.freeze({
    NORMAL_CLEANING: 0,
    MOP_MOVES: 1,  // back and forth mopping movement (unsure if this has an effect without mop-mode)
    OUTLINE: 2,  // Only clean the rooms outline.
    ZONED_CLEAN_OR_MOPPING: 3,
});

const FAN_SPEEDS = Object.freeze({
    [stateAttrs.IntensityStateAttribute.VALUE.LOW]: 0,
    [stateAttrs.IntensityStateAttribute.VALUE.MEDIUM]: 1,
    [stateAttrs.IntensityStateAttribute.VALUE.HIGH]: 2,
    [stateAttrs.IntensityStateAttribute.VALUE.MAX]: 3
});

const WATER_GRADES = Object.freeze({
    [stateAttrs.IntensityStateAttribute.VALUE.LOW]: 11,
    [stateAttrs.IntensityStateAttribute.VALUE.MEDIUM]: 12,
    [stateAttrs.IntensityStateAttribute.VALUE.HIGH]: 13,
});

module.exports = {
    ViomiBoxType: ViomiBoxType,
    ViomiArea: ViomiArea,
    ViomiOperationMode: ViomiOperationMode,
    ViomiOperation: ViomiOperation,
    ViomiMovementMode: ViomiMovementMode,
    FAN_SPEEDS: FAN_SPEEDS,
    WATER_GRADES: WATER_GRADES
};
