/**
 * Commands to be used, whenever possible, for MQTT command topics.
 * Most values are those supported by OpenHab: https://www.openhab.org/docs/concepts/items.html#enum-types
 */

/**
 * Standard project-wide MQTT commands for properties with "just do it"-style command topics.
 *
 * @enum {string}
 */
const BASIC = Object.freeze({
    PERFORM: "PERFORM",
});

/**
 * Commands for basic vacuum control.
 *
 * @enum {string}
 */
const BASIC_CONTROL = Object.freeze({
    START: "START",
    STOP: "STOP",
    PAUSE: "PAUSE",
    HOME: "HOME",
});

/**
 * Special commands for Home Assistant
 *
 * @enum {string}
 */
const HASS = Object.freeze({
    LOCATE: "LOCATE",
});

/**
 * @enum {string}
 */
const SWITCH = Object.freeze({
    ON: "ON",
    OFF: "OFF",
});

/**
 * @enum {string}
 */
const INC_DEC = Object.freeze({
    INCREASE: "INCREASE",
    DECREASE: "DECREASE"
});

/**
 * @enum {string}
 */
const NEXT_PREV = Object.freeze({
    NEXT: "NEXT",
    PREVIOUS: "PREVIOUS",
});

/**
 * @enum {string}
 */
const OPEN_CLOSED = Object.freeze({
    OPEN: "OPEN",
    CLOSED: "CLOSED"
});

/**
 * @enum {string}
 */
const PLAYBACK = Object.freeze({
    PLAY: "PLAY",
    PAUSE: "PAUSE"
});

/**
 * @enum {string}
 */
const STOP_MOVE = Object.freeze({
    STOP: "STOP",
    MOVE: "MOVE"
});

/**
 * @enum {string}
 */
const UP_DOWN = Object.freeze({
    UP: "UP",
    DOWN: "DOWN"
});

module.exports = {
    BASIC: BASIC,
    BASIC_CONTROL: BASIC_CONTROL,
    HASS: HASS,
    INC_DEC: INC_DEC,
    NEXT_PREV: NEXT_PREV,
    OPEN_CLOSED: OPEN_CLOSED,
    PLAYBACK: PLAYBACK,
    STOP_MOVE: STOP_MOVE,
    SWITCH: SWITCH,
    UP_DOWN: UP_DOWN,
};
