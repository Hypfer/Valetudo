const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const DataType = require("../homie/DataType");

class BasicControlCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/BasicControlCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Basic control"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "operation",
            friendlyName: "Operation",
            datatype: DataType.ENUM,
            format: Object.values(BASIC_CONTROL_COMMAND).join(","),
            setter: async (value) => {
                await this.capability[value]();
            }
        }));
    }
}

const BASIC_CONTROL_COMMAND = Object.freeze({
    START: "start",
    STOP: "stop",
    PAUSE: "pause",
    HOME: "home",
});

module.exports = BasicControlCapabilityMqttHandle;
