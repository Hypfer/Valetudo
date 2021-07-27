const NotImplementedError = require("../core/NotImplementedError");

/**
 * Interface to be implemented by object that want to subscribe to changes in attributes of a ContainerEntity.
 *
 * @abstract
 */
class AttributeSubscriber {
    /**
     * Callback for attribute updates
     *
     * @public
     * @abstract
     * @param {string} eventType
     * @param {import("./Attribute")} attribute
     * @param {import("./Attribute")} [previousAttribute]
     */
    onAttributeEvent(eventType, attribute, previousAttribute) {
        throw new NotImplementedError();
    }
}

/**
 * @enum {string}
 */
AttributeSubscriber.EVENT_TYPE = Object.freeze({
    ADD: "add",
    CHANGE: "change",
    DELETE: "delete"
});

module.exports = AttributeSubscriber;
