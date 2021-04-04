const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const {Commands} = require("../common");

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
            format: Object.values(Commands.BASIC_CONTROL).join(","),
            setter: async (value) => {
                await this.capability[value]();
            }
        }).also((prop) => {
            HassAnchor.getTopicReference(HassAnchor.REFERENCE.BASIC_CONTROL_COMMAND)
                .post(prop.getBaseTopic() + "/set").then();
        }));
    }
}



module.exports = BasicControlCapabilityMqttHandle;
