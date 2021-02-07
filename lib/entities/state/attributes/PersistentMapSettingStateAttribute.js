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
}

/**
 *  @typedef {string} PersistentMapSettingStateAttributeValue
 *  @enum {string}
 *
 */
PersistentMapSettingStateAttribute.VALUE = Object.freeze({
    DISABLED: "disabled",
    ENABLED: "enabled",
    MULTI: "multi" //TODO
});


module.exports = PersistentMapSettingStateAttribute;
