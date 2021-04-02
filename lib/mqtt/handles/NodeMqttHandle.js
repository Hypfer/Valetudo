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
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {string} options.topicName Topic ID following the linked format
     * @param {string} options.friendlyName User-friendly name for this node
     * @param {string} options.type Type of this node, such as the capability name
     */
    constructor(options) {
        super(options);

        /** @type {import("../MqttController")} */
        this.controller = options.controller;
        this.type = options.type;
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
            "$properties": this.children.map(p => p.topicName).join(",")
        };
    }
}

module.exports = NodeMqttHandle;
