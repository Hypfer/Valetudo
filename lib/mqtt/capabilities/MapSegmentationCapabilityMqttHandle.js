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
            format: "segment or segments JSON array",
            setter: async (value) => {
                let reqSegments = JSON.parse(value);
                if (reqSegments === null || reqSegments === undefined) {
                    throw new Error("Invalid segment(s)");
                }
                if (!Array.isArray(reqSegments)) {
                    reqSegments = [reqSegments];
                }
                const robotSegments = await this.capability.getSegments();
                const segments = [];
                for (const id of reqSegments) {
                    const segment = robotSegments.find(segm => parseInt(segm.id) === id);
                    if (!segment) {
                        throw new Error(`Segment ID does not exist, or map was not loaded: ${id}`);
                    }
                    segments.push(segment);
                }
                await this.capability.executeSegmentAction(segments);
            }
        }));
    }
}

module.exports = MapSegmentationCapabilityMqttHandle;
