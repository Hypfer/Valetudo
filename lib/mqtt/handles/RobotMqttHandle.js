const MqttHandle = require("./MqttHandle");

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
    }
}

module.exports = RobotMqttHandle;
