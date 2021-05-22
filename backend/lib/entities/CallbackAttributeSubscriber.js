const AttributeSubscriber = require("./AttributeSubscriber");

class CallbackAttributeSubscriber extends AttributeSubscriber {
    /**
     * @callback callback
     * @param {string} eventType
     * @param {import("./Attribute")} attribute
     */
    /**
     * @param {callback} callback
     */
    constructor(callback) {
        super();
        this.callback = callback;
    }

    onAttributeEvent(eventType, attribute) {
        this.callback(eventType, attribute);
    }
}

module.exports = CallbackAttributeSubscriber;
