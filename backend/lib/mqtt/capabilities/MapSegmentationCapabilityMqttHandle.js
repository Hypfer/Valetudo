const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const DataType = require("../homie/DataType");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class MapSegmentationCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/MapSegmentationCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Segment cleaning"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "clean",
            friendlyName: "Clean segments",
            datatype: DataType.STRING,
            format: "same json as the REST interface",
            setter: async (value) => {
                const reqSegments = JSON.parse(value);

                if (Array.isArray(reqSegments.segment_ids) && reqSegments.segment_ids.length > 0) {
                    const requestOptions = {};

                    if (typeof reqSegments.iterations === "number") {
                        requestOptions.iterations = reqSegments.iterations;
                    }

                    if (reqSegments.customOrder === true) {
                        requestOptions.customOrder = true;
                    }

                    const robotSegments = await this.capability.getSegments();
                    const segments = [];

                    for (const id of reqSegments.segment_ids) {
                        const segment = robotSegments.find(segm => {
                            return (segm.id === id || parseInt(segm.id) === id);
                        });
                        if (!segment) {
                            throw new Error(`Segment ID does not exist, or map was not loaded: ${id}`);
                        }
                        segments.push(segment);
                    }

                    await this.capability.executeSegmentAction(segments, requestOptions);
                } else if (Array.isArray(reqSegments.segment_names) && reqSegments.segment_names.length > 0){
                    const requestOptions = {};

                    if (typeof reqSegments.iterations === "number") {
                        requestOptions.iterations = reqSegments.iterations;
                    }

                    if (reqSegments.customOrder === true) {
                        requestOptions.customOrder = true;
                    }

                    const robotSegments = await this.capability.getSegments();
                    const segments = [];

                    for (const name of reqSegments.segment_names) {
                        const segment = robotSegments.find(segm => {
                            return (segm.name === name)
                        });
                        if (!segment) {
                            throw new Error(`Segment Name does not exist, or map was not loaded: ${name}`);
                        }
                        segments.push(segment);
                    }
                } else {
                    throw new Error("Missing or empty segment_ids Array in payload");
                }
            },
            helpText: "This handle accepts a JSON object identical to the one used by the REST API.\n\n" +
                "Please refer to the \"General Help\" section in Valetudo for more information.\n\n" +
                "Sample payload:\n\n" +
                "```json\n" +
                JSON.stringify({
                    segment_ids: [
                        "20",
                        "18",
                        "16"
                    ],
                    iterations: 2,
                    customOrder: true
                }, null, 2) +
                "\n```" + 
                "\n\n Also possible:\n\n" +
                "```json\n" +
                JSON.stringify({
                    segment_names: [
                        "Kitchen",
                        "Livingroom",
                        "Bathroom"
                    ],
                    iterations: 1,
                    customOrder: false
                }, null, 2) + 
                "\n```"
        }));
    }
}

MapSegmentationCapabilityMqttHandle.OPTIONAL = false;

module.exports = MapSegmentationCapabilityMqttHandle;
