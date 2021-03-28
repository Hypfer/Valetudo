/**
 * A Node represents one set of multiple properties. For example a node may be a capability, or a part of the main
 * robot status.
 */
class NodeMqttHandler {
    /**
     * Please see https://homieiot.github.io/specification/spec-core-develop//#node-attributes
     * for more details
     *
     * topicName must follow the Topic ID format: https://homieiot.github.io/specification/spec-core-develop/#topic-ids
     *
     * @param {object} options
     * @param {import(./MqttController)} options.controller MqttController instance
     * @param {string} options.topicName Topic ID following the linked format
     * @param {string} options.friendlyName User-friendly name for this node
     * @param {string} options.type Type of this node, such as the capability name
     */
    constructor(options) {
        /** @type {import(./MqttController)} */
        this.controller = options.controller;

        this.topicName = options.topicName;
        this.friendlyName = options.friendlyName;
        this.type = options.type;

        /** @type {Array<import(./PropertyMqttHandler)>} */
        this.properties = [];
    }

    /**
     * Returns Homie attributes for the current node.
     *
     * @return {object}
     */
    getHomieAttributes() {
        return {
            "$name": this.friendlyName,
            "$type": this.type,
            "$properties": this.properties.map(p => p.topicName).join(",")
        };
    }

    /**
     * Register a property to this node
     *
     * @param {import(./PropertyMqttHandler)} property
     * @return {Promise<void>}
     */
    async registerProperty(property) {
        if (this.controller.isInitialized()) {
            throw new Error("New properties may only be registered while the MQTT controller is not initialized");
        }
        property.setNode(this);
        property.setController(this.controller);
        await property.configure();
        this.properties.push(property);
    }

    /**
     * Deregister property
     *
     * @param {import(./PropertyMqttHandler)} property
     * @return {Promise<void>}
     */
    async deregisterProperty(property) {
        if (this.controller.isInitialized()) {
            throw new Error("Properties may only be deregistered while the MQTT controller is not initialized");
        }
        property.setNode(null);
        property.setController(null);
        await property.deconfigure();
        const idx = this.properties.indexOf(property);
        if (idx >= 0) {
            this.properties.splice(idx, 1);
        }
    }

    /**
     * Republish all properties bound to this node.
     *
     * @return {Promise<void>}
     */
    async refresh() {
        for (let i = 0; i < this.properties.length; i++) {
            await this.controller.refreshProperty(this.properties[i]);
        }
    }

    /**
     * Configure this node. It will re-publish all autodiscovery-related attributes.
     * It will not configure registered properties.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @return {Promise<void>}
     */
    async configure() {
        if (this.controller.isInitialized()) {
            throw new Error("New properties may only be registered while the MQTT controller is not initialized");
        }
        // TODO
    }

    /**
     * Deconfigure this node. It will publish zero-length payloads to all autodiscovery-related attributes.
     * It will not deconfigure registered properties.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @return {Promise<void>}
     */
    async deconfigure() {
        if (this.controller.isInitialized()) {
            throw new Error("New properties may only be registered while the MQTT controller is not initialized");
        }
        // TODO
    }
}

module.exports = NodeMqttHandler;
