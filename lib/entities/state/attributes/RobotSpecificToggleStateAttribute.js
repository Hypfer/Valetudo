const StateAttribute = require("./StateAttribute");

/**
 * Represents a robot specific toggle.
 * Having it in the state makes it easier to propagate the changes to MQTT. However, front-ends should use
 * RobotSpecificToggleCapability.getToggles() to ensure they get up-to-date values.
 */
class RobotSpecificToggleStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {RobotSpecificToggleStateAttributeType} options.type
     * @param {boolean} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.value = options.value;
    }
}

/**
 *  @typedef {string} RobotSpecificToggleStateAttributeType
 *  @enum {string}
 */
RobotSpecificToggleStateAttribute.TYPE = Object.freeze({
    LEDS: "leds",
    REPEAT_CLEANING: "repeat_cleaning",
});

module.exports = RobotSpecificToggleStateAttribute;
