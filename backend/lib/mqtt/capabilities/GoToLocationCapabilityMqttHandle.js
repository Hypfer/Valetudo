const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const DataType = require("../homie/DataType");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const ValetudoGoToLocation = require("../../entities/core/ValetudoGoToLocation");

class GoToLocationCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/GoToLocationCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Go to location"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "go",
            friendlyName: "Go to location",
            datatype: DataType.STRING,
            format: "same json as the REST interface",
            setter: async (value) => {
                const reqGoToLocation = JSON.parse(value);

                if (
                    reqGoToLocation && reqGoToLocation.coordinates &&
                    typeof reqGoToLocation.coordinates.x === "number" &&
                    typeof reqGoToLocation.coordinates.y === "number"
                ) {
                    await this.capability.goTo(new ValetudoGoToLocation({
                        coordinates: {
                            x: reqGoToLocation.coordinates.x,
                            y: reqGoToLocation.coordinates.y
                        }
                    }));
                } else {
                    throw new Error("Invalid go to location payload");
                }
            },
            helpText: "This handle accepts a JSON object identical to the one used by the REST API.\n\n" +
                "Please refer to the \"General Help\" section in Valetudo for more information.\n\n" +
                "Sample payload:\n\n" +
                "```json\n" +
                JSON.stringify({
                    coordinates: {
                        x: 50,
                        y: 50
                    }
                }, null, 2) +
                "\n```"
        }));
    }

}

module.exports = GoToLocationCapabilityMqttHandle;

