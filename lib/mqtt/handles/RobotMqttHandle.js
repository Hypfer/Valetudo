const MqttHandle = require("./MqttHandle");

/**
 * This class represents the robot as a Homie device
 */
class RobotMqttHandle extends MqttHandle {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../MqttController")} options.controller
     * @param {string} options.baseTopic Base topic for Valetudo
     * @param {string} options.topicName Topic identifier for this robot
     * @param {string} options.friendlyName Friendly name for this robot
     */
    constructor(options) {
        super(options);
        this.robot = options.robot;
        this.baseTopic = options.baseTopic;
    }

    getBaseTopic() {
        return this.baseTopic + "/" + this.topicName;
    }

    getHomieAttributes() {
        // $state is managed by MqttController
        return {
            "$homie": "4.0.0",
            "$name": this.friendlyName,
            "$nodes": this.children.map(p => p.topicName).join(","),
            "$extensions": "",
        };
    }
}

module.exports = RobotMqttHandle;
