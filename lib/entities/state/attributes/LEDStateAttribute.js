const StateAttribute = require("./StateAttribute");

class LEDStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {LEDStateAttributeType} options.type
     * @param {LEDStateAttributeSubType} [options.subType]
     * @param {object} options.metaData
     * @param {LEDStateAttributeStatus} options.metaData.status
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.subType = options.subType ?? LEDStateAttribute.SUB_TYPE.NONE;
    }
}

/**
 *  @typedef {string} LEDStateAttributeType
 *  @enum {string}
 *
 */
LEDStateAttribute.TYPE = Object.freeze({
    STATUS: "status",  // Use STATUS if the vacuum only allows for all on/off LED control
    POWER: "power",
    NETWORK: "network",
    CHARGE: "charge",
});

/**
 *  @typedef {string} LEDStateAttributeSubType
 *  @enum {string}
 *
 */
LEDStateAttribute.SUB_TYPE = Object.freeze({
    NONE: "none",  // Use NONE if the vacuum only allows for all on/off LED control
    MAIN: "main",
    SIDE_LEFT: "side_left",
    SIDE_RIGHT: "side_right"
});

/**
 *
 * @typedef {string} LEDStateAttributeStatus
 * @enum {string}
 */
LEDStateAttribute.STATUS = Object.freeze({
    ON: "on",
    OFF: "off",
});


module.exports = LEDStateAttribute;
