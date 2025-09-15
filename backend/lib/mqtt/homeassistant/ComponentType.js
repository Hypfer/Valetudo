/**
 * Retrieved from https://www.home-assistant.io/docs/mqtt/discovery/ on 2025-09-15.
 *
 * @enum {string}
 */
const ComponentType = Object.freeze({
    ALARM_CONTROL_PANEL: "alarm_control_panel",
    BINARY_SENSOR: "binary_sensor",
    BUTTON: "button",
    CAMERA: "camera",
    CLIMATE: "climate",
    COVER: "cover",
    DEVICE_TRACKER: "device_tracker",
    DEVICE_TRIGGER: "device_trigger",
    EVENT: "event",
    FAN: "fan",
    HUMIDIFIER: "humidifier",
    IMAGE: "image",
    LAWN_MOWER: "lawn_mower",
    LIGHT: "light",
    LOCK: "lock",
    NOTIFY: "notify",
    NUMBER: "number",
    SCENE: "scene",
    SELECT: "select",
    SENSOR: "sensor",
    SIREN: "siren",
    SWITCH: "switch",
    TAG_SCANNER: "tag",
    TEXT: "text",
    UPDATE: "update",
    VACUUM: "vacuum",
    VALVE: "valve",
    WATER_HEATER: "water_heater",
});

module.exports = ComponentType;
