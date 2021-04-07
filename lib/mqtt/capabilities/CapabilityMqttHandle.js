const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");

class CapabilityMqttHandle extends RobotStateNodeMqttHandle {
    /**
     * Please see https://homieiot.github.io/specification/spec-core-develop//#node-attributes
     * for more details
     *
     * topicName must follow the Topic ID format: https://homieiot.github.io/specification/spec-core-develop/#topic-ids
     *
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/Capability")} options.capability
     * @param {string} options.friendlyName User-friendly name for this node
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: options.capability.getType(),
            type: "Capability"
        }));

        this.capability = options.capability;
    }
}

module.exports = CapabilityMqttHandle;
