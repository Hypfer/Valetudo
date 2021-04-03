const CallbackAttributeSubscriber = require("../../entities/CallbackAttributeSubscriber");
const MqttHandle = require("./MqttHandle");

const capabilities = require("../../core/capabilities");
const capabilityHandles = require("../capabilities");
const stateHandles = require("../status");
const stateAttrs = require("../../entities/state/attributes");

/**
 * This class represents the robot as a Homie device
 */
class RobotMqttHandle extends MqttHandle {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../MqttController")} options.controller
     * @param {string} options.baseTopic Base topic for Valetudo
     * @param {string} options.topicName Topic identifier for this robot
     * @param {string} options.friendlyName Friendly name for this robot
     */
    constructor(options) {
        super(options);
        this.robot = options.robot;
        this.baseTopic = options.baseTopic;

        for (const [type, capability] of Object.entries(this.robot.capabilities)) {
            if (CAPABILITY_TYPE_TO_HANDLE_MAPPING[type] !== undefined) {
                this.registerChild(new CAPABILITY_TYPE_TO_HANDLE_MAPPING[type]({
                    parent: this,
                    capability: capability,
                    controller: this.controller,
                    robot: this.robot,
                }));
            }
        }

        this.statusSubscriber = new CallbackAttributeSubscriber((eventType, attribute) => {
            this.onStatusAttributeEvent(eventType, attribute).then();
        });

        for (const item of STATUS_ATTR_TO_HANDLE_MAPPING) {
            this.robot.state.subscribe(this.statusSubscriber, item.matcher);
        }
    }

    /**
     * Register status handles when their status is published for the first time.
     *
     * @private
     * @param {string} eventType
     * @param {import("../../entities/Attribute")} attribute
     * @return {Promise<string>}
     */
    async onStatusAttributeEvent(eventType, attribute) {
        if (eventType !== CallbackAttributeSubscriber.EVENT_TYPE.ADD) {
            return;
        }
        const matchingMappings = STATUS_ATTR_TO_HANDLE_MAPPING.filter((item) => {
            if (item.matcher.attributeClass !== attribute.__class) {
                return false;
            }
            if (item.matcher.attributeType !== undefined && item.matcher.attributeType !== attribute.type) {
                return false;
            }
            // noinspection RedundantIfStatementJS // screw the linter, readability first
            if (item.matcher.attributeSubType !== undefined && item.matcher.attributeSubType !== attribute.subType) {
                return false;
            }
            return true;
        });
        const matchingMatchers = matchingMappings.map(item => item.matcher);
        const matchingHandles = matchingMappings.map(item => item.handle);

        // Unsubscribe self from status since we're not interested in this attribute any more once the handle is registered
        for (const matcher of matchingMatchers) {
            this.robot.state.unsubscribe(this.statusSubscriber, matcher);
        }

        await this.controller.reconfigure(async () => {
            for (const handle of matchingHandles) {
                this.registerChild(new handle({
                    parent: this,
                    controller: this.controller,
                    robot: this.robot,
                }));
            }
            await this.deconfigure({
                cleanHomie: false,
                cleanValues: false,
                unsubscribe: false
            });
            await this.configure();
        });
    }

    getBaseTopic() {
        return this.baseTopic + "/" + this.topicName;
    }

    getHomieAttributes() {
        // $state is managed by MqttController
        return {
            "$homie": "4.0.0",
            "$name": this.friendlyName,
            "$nodes": this.children.map(p => p.topicName).join(","),
            "$extensions": "",
            "$implementation": "Valetudo"
        };
    }
}

const CAPABILITY_TYPE_TO_HANDLE_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityHandles.IntensityPresetCapabilityMqttHandle,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityHandles.IntensityPresetCapabilityMqttHandle,
    [capabilities.LocateCapability.TYPE]: capabilityHandles.LocateCapabilityMqttHandle,
};

const STATUS_ATTR_TO_HANDLE_MAPPING = [
    {
        matcher: {attributeClass: stateAttrs.BatteryStateAttribute.name},
        handle: stateHandles.BatteryStateMqttHandle
    },
];

module.exports = RobotMqttHandle;
