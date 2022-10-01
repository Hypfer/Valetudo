const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Command = require("../common/Commands");
const DataType = require("../homie/DataType");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class AutoEmptyDockManualTriggerCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/AutoEmptyDockManualTriggerCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Auto Empty Dock Manual Trigger"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "trigger",
            friendlyName: "Auto Empty Dock Manual Trigger",
            datatype: DataType.ENUM,
            format: Command.BASIC.PERFORM,
            setter: async (value) => {
                await this.capability.triggerAutoEmpty();
            }
        }));
    }
}

AutoEmptyDockManualTriggerCapabilityMqttHandle.OPTIONAL = false;

module.exports = AutoEmptyDockManualTriggerCapabilityMqttHandle;
