
const SETTING = Object.freeze({
    SET_WORK_STATUS: 0x01, // This is the state, the high-level state machine is in. To get the robot to do things, you set it
    DO_MANUAL_CONTROL_CMD: 0x02,
    START_SEGMENT_CLEANUP: 0x03,
    START_ZONE_CLEANUP: 0x05,
    SET_VIRTUAL_WALLS: 0x20,
    SET_RESTRICTED_ZONES: 0x21,
    MAP_MANAGEMENT: 0x24,
    JOIN_SEGMENTS: 0x26,
    SPLIT_SEGMENT: 0x27,
    SET_VALID_MAP_IDS: 0x2D, // Used by the cloud to sync cloud state with device state. The cloud being higher prio
    SET_FAN_SPEED: 0x50,
    SET_WATER_GRADE: 0x51,
    SET_CARPET_MODE: 0x52, // J12. Not sure about newer robots
    SET_DOCK_INTERVALS: 0x56,
    SET_OPERATION_MODE: 0x58,
    TRIGGER_STATION_ACTION: 0x5A,
    SET_CARPET_BEHAVIOR_SETTINGS: 0x5E,
    SET_STAIRLESS_MODE: 0x63,
    SET_DND: 0x92,
    SET_VOLUME: 0x93,
    SET_VARIOUS_TOGGLES: 0x9C,
    SET_HOT_WASH: 0xC5,
    SET_AUTO_EMPTY_DURATION: 0xC7,
    SET_CLEANING_SETTINGS_1: 0xC9, // FIXME: naming
});

const ACTION = Object.freeze({
    GET_STATUS: 0x01,
    LIST_MAPS: 0x20,
    POLL_MAP: 0x22,
    GET_DOCK_POSITION: 0x24,
    GET_ACTIVE_ZONES: 0x27,
    LOCATE: 0x57,
    // 0x59 seems to maybe provide a bunch of feature bits? Reporting capabilities of the robot
    GET_DND: 0x90,
    GET_CLEANING_SETTINGS_1: 0xAA, // FIXME: naming
    GET_CARPET_BEHAVIOR_SETTINGS: 0xAB
});

const EVENT = Object.freeze({
    STATUS: 0x01,
    ACTIVE_ZONES: 0x22,
    ERROR: 0xA3,
    CLEANING_SETTINGS_1: 0xAA // FIXME: naming
});

module.exports = {
    SETTING: SETTING,
    ACTION: ACTION,
    EVENT: EVENT
};
