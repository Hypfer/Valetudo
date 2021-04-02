const CallbackAttributeSubscriber = require("../../entities/CallbackAttributeSubscriber");
const NodeMqttHandle = require("./NodeMqttHandle");

/**
 * MQTT node handle that can subscribe to robot status updates.
 */
class RobotStateNodeMqttHandle extends NodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.topicName Topic ID following the linked format
     * @param {string} options.friendlyName User-friendly name for this node
     */
    constructor(options) {
        super(Object.assign(options, {
            type: "Capability"
        }));

        this.robot = options.robot;
        this.statusSubscriber = new CallbackAttributeSubscriber(() => {
            this.refresh().then();
        });
    }

    async configure() {
        await super.configure();
        for (const matcher of this.getInterestingStatusAttributes()) {
            this.robot.state.subscribe(this.statusSubscriber, matcher);
        }
    }

    async deconfigure() {
        this.robot.state.unsubscribeAll(this.statusSubscriber);
        await super.deconfigure();
    }

    /**
     * This method must return matchers for any state attributes that should trigger a refresh of this handle.
     * An empty list is returned by default.
     *
     * @public
     * @return {Array<import("../../entities/ContainerEntity").AttributeMatcher>}
     */
    getInterestingStatusAttributes() {
        return [];
    }
}

module.exports = RobotStateNodeMqttHandle;
