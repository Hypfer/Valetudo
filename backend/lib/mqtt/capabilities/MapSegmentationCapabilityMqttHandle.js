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
                    const options = {};

                    if (typeof reqSegments.iterations === "number") {
                        options.iterations = reqSegments.iterations;
                    }

                    if (reqSegments.customOrder === true) {
                        options.customOrder = true;
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

                    await this.capability.executeSegmentAction(segments, options);
                } else {
                    throw new Error("Missing or empty segment_ids Array in payload");
                }
            }
        }));
    }
}

module.exports = MapSegmentationCapabilityMqttHandle;
