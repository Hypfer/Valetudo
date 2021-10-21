const StateAttribute = require("./StateAttribute");

class PersistentMapSettingStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {PersistentMapSettingStateAttributeValue} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.value = options.value;
    }

    /**
     *
     * @param {PersistentMapSettingStateAttribute} otherAttribute
     * @return {boolean}
     */
    equals(otherAttribute) {
        return this.__class === otherAttribute.__class &&
            this.type === otherAttribute.type &&
            this.subType === otherAttribute.subType &&
            this.value === otherAttribute.value;
    }
}

/**
 *  @typedef {string} PersistentMapSettingStateAttributeValue
 *  @enum {string}
 *
 */
PersistentMapSettingStateAttribute.VALUE = Object.freeze({
    DISABLED: "disabled",
    ENABLED: "enabled"
});


module.exports = PersistentMapSettingStateAttribute;
