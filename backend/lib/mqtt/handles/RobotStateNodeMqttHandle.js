const CallbackAttributeSubscriber = require("../../entities/CallbackAttributeSubscriber");
const NodeMqttHandle = require("./NodeMqttHandle");

/**
 * MQTT node handle that can subscribe to robot status updates.
 */
class RobotStateNodeMqttHandle extends NodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("./RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.topicName Topic ID following the linked format
     * @param {string} options.friendlyName User-friendly name for this node
     * @param {string} options.type Type of this node, such as "Capability", "Status", etc.
     * @param {string} [options.helpText] Optional help message to be included in the documentation
     * @param {object} [options.helpMayChange] Optional object of what:dueTo pairs explaining stuff that may have a
     * different format, unit, children properties and that should be scanned dynamically, to be included in the docs.
     */
    constructor(options) {
        super(options);

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

    async deconfigure(options) {
        this.robot.state.unsubscribeAll(this.statusSubscriber);
        await super.deconfigure(options);
    }

    /**
     * This method must return matchers for any state attributes that should trigger a refresh of this handle.
     * An empty list is returned by default.
     *
     * @public
     * @return {Array<import("../../entities/ContainerEntity").AttributeMatcher|any>}
     */
    getInterestingStatusAttributes() {
        return [];
    }
}

module.exports = RobotStateNodeMqttHandle;
