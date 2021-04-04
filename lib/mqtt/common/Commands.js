/**
 * Standard project-wide MQTT commands for properties with "just do it"-style command topics.
 *
 * @enum {string}
 */
const BASIC = Object.freeze({
    PERFORM: "PERFORM",
});

const BASIC_CONTROL = Object.freeze({
    START: "START",
    STOP: "STOP",
    PAUSE: "PAUSE",
    HOME: "HOME",
});

module.exports = {
    BASIC: BASIC,
    BASIC_CONTROL: BASIC_CONTROL,
};
