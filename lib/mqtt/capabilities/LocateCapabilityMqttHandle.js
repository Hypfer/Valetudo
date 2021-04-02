const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const DataType = require("../homie/DataType");
const Command = require("../homie/Command");

class LocateCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/LocateCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Locate"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "locate",
            friendlyName: "Locate",
            datatype: DataType.ENUM,
            format: Command.PERFORM,
            setter: async (value) => {
                await this.capability.locate();
            }
        }));
    }
}

module.exports = LocateCapabilityMqttHandle;
