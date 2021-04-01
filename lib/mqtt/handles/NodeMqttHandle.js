/**
 * A Node represents one set of multiple properties. For example a node may be a capability, or a part of the main
 * robot status.
 */
const MqttHandle = require("./MqttHandle");

class NodeMqttHandle extends MqttHandle {
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
        super();

        /** @type {import(./MqttController)} */
        this.controller = options.controller;

        this.topicName = options.topicName;
        this.friendlyName = options.friendlyName;
        this.type = options.type;

        /** @type {Array<import(./PropertyMqttHandler)>} */
        this.properties = [];
    }

    getBaseTopic() {
        return ""; // TODO
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
     * Deregister all properties.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @return {Promise<void>}
     */
    async deregisterAllProperties() {
        while (this.properties.length > 0) {
            await this.deregisterProperty(this.properties[0]);
        }
    }

    /**
     * Republish the values of all properties bound to this node.
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

module.exports = NodeMqttHandle;
