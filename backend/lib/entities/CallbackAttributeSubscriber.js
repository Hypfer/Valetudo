const AttributeSubscriber = require("./AttributeSubscriber");

class CallbackAttributeSubscriber extends AttributeSubscriber {
    /**
     * @callback callback
     * @param {string} eventType
     * @param {import("./Attribute")} attribute
     * @param {import("./Attribute")} [previousAttribute]
     */
    /**
     * @param {callback} callback
     */
    constructor(callback) {
        super();
        this.callback = callback;
    }

    onAttributeEvent(eventType, attribute, previousAttribute) {
        this.callback(eventType, attribute, previousAttribute);
    }
}

module.exports = CallbackAttributeSubscriber;
