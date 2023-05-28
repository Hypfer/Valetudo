/**
 * Retrieved from https://www.home-assistant.io/docs/mqtt/discovery/ on 2021-04-05.
 *
 * @enum {string}
 */
const ComponentType = Object.freeze({
    ALARM_CONTROL_PANEL: "alarm_control_panel",
    BINARY_SENSOR: "binary_sensor",
    BUTTON: "button",
    CAMERA: "camera",
    COVER: "cover",
    DEVICE_TRACKER: "device_tracker",
    DEVICE_TRIGGER: "device_trigger",
    FAN: "fan",
    HVAC: "climate",
    LIGHT: "light",
    LOCK: "lock",
    NUMBER: "number",
    SCENE: "scene",
    SELECT: "select",
    SENSOR: "sensor",
    SWITCH: "switch",
    TAG_SCANNER: "tag",
    VACUUM: "vacuum",
});

module.exports = ComponentType;
