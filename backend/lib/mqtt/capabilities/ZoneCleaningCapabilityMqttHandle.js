const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const DataType = require("../homie/DataType");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const ValetudoZone = require("../../entities/core/ValetudoZone");

class ZoneCleaningCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/ZoneCleaningCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Zone cleaning"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "start",
            friendlyName: "Start zoned cleaning",
            datatype: DataType.STRING,
            format: "same json as the REST interface",
            setter: async (value) => {
                const req = JSON.parse(value);

                if (Array.isArray(req?.zones)) {
                    await this.capability.start(req.zones.map(z => {
                        return new ValetudoZone({
                            points: z.points,
                            iterations: z.iterations
                        });
                    }));
                } else {
                    throw new Error("Invalid zone cleaning payload");
                }
            },
            helpText: "This handle accepts a JSON object identical to the one used by the REST API.\n\n" +
                "Please refer to the \"General Help\" section in Valetudo for more information.\n\n" +
                "Sample payload:\n\n" +
                "```json\n" +
                JSON.stringify({
                    zones: [
                        {
                            iterations: 1,
                            points: {
                                pA: {
                                    x: 50,
                                    y: 50
                                },
                                pB: {
                                    x: 100,
                                    y: 50
                                },
                                pC: {
                                    x: 100,
                                    y: 100
                                },
                                pD: {
                                    x: 50,
                                    y: 100
                                }
                            }
                        }
                    ]
                }, null, 2) +
                "\n```"
        }));
    }

}

module.exports = ZoneCleaningCapabilityMqttHandle;

