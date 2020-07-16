const StateAttribute = require("./StateAttribute");

class PersistentMapSettingStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.value {PersistentMapSettingStateAttributeValue}
     * @param [options.metaData] {object}
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