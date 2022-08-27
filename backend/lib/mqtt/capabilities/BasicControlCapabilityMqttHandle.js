const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Commands = require("../common/Commands");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

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
                switch (value) {
                    case Commands.BASIC_CONTROL.START:
                        await this.capability.start();
                        break;
                    case Commands.BASIC_CONTROL.STOP:
                        await this.capability.stop();
                        break;
                    case Commands.BASIC_CONTROL.PAUSE:
                        await this.capability.pause();
                        break;
                    case Commands.BASIC_CONTROL.HOME:
                        await this.capability.home();
                        break;
                }
            }
        }).also((prop) => {
            HassAnchor.getTopicReference(HassAnchor.REFERENCE.BASIC_CONTROL_COMMAND).post(prop.getBaseTopic() + "/set").catch(err => {
                Logger.error("Error while posting value to HassAnchor", err);
            });
        }));
    }
}


module.exports = BasicControlCapabilityMqttHandle;
