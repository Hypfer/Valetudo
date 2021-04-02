const MqttHandle = require("./MqttHandle");

const capabilities = require("../../core/capabilities");
const capabilityHandles = require("../capabilities");

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

        for (const [type, capability] of Object.entries(this.robot.capabilities)) {
            if (CAPABILITY_TYPE_TO_HANDLE_MAPPING[type] !== undefined) {
                this.registerChild(new CAPABILITY_TYPE_TO_HANDLE_MAPPING[type]({
                    parent: this,
                    capability: capability,
                    controller: this.controller,
                    robot: this.robot,
                }));
            }
        }
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
            "$implementation": "Valetudo"
        };
    }
}

// eslint-disable-next-line no-unused-vars
const CAPABILITY_TYPE_TO_HANDLE_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityHandles.IntensityPresetCapabilityMqttHandle,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityHandles.IntensityPresetCapabilityMqttHandle,
    [capabilities.LocateCapability.TYPE]: capabilityHandles.LocateCapabilityMqttHandle,
};

module.exports = RobotMqttHandle;
