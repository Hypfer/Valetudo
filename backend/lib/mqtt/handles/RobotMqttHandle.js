const CallbackAttributeSubscriber = require("../../entities/CallbackAttributeSubscriber");
const MqttHandle = require("./MqttHandle");

const CAPABILITY_TYPE_TO_HANDLE_MAPPING = require("./HandleMappings").CAPABILITY_TYPE_TO_HANDLE_MAPPING;
const Logger = require("../../Logger");
const MapNodeMqttHandle = require("./MapNodeMqttHandle");
const STATUS_ATTR_TO_HANDLE_MAPPING = require("./HandleMappings").STATUS_ATTR_TO_HANDLE_MAPPING;
const VacuumHassComponent = require("../homeassistant/components/VacuumHassComponent");
const ValetudoEventsNodeMqttHandle = require("./ValetudoEventsNodeMqttHandle");

/**
 * This class represents the robot as a Homie device
 */
class RobotMqttHandle extends MqttHandle {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../MqttController")} options.controller
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {string} options.baseTopic Base topic for Valetudo
     * @param {string} options.topicName Topic identifier for this robot
     * @param {string} options.friendlyName Friendly name for this robot
     * @param {Array<string>} options.optionalExposedCapabilities
     */
    constructor(options) {
        super(options);
        this.robot = options.robot;
        this.valetudoEventStore = options.valetudoEventStore;
        this.baseTopic = options.baseTopic;
        this.mapHandle = null;

        // Attach map handle
        this.mapHandle = new MapNodeMqttHandle({
            parent: this,
            controller: this.controller,
            robot: this.robot
        });
        this.registerChild(this.mapHandle);

        this.valetudoEventsHandle = new ValetudoEventsNodeMqttHandle({
            parent: this,
            controller: this.controller,
            robot: this.robot,
            valetudoEventStore: this.valetudoEventStore
        });
        this.registerChild(this.valetudoEventsHandle);

        // Attach all available capabilities to self
        for (const [type, capability] of Object.entries(this.robot.capabilities)) {
            const handle = CAPABILITY_TYPE_TO_HANDLE_MAPPING[type];

            if (handle !== undefined && (handle.OPTIONAL !== true || options.optionalExposedCapabilities.includes(type))) {
                this.registerChild(new handle({
                    parent: this,
                    capability: capability,
                    controller: this.controller,
                    robot: this.robot,
                }));
            }
        }

        // Subscribe to all available status attributes. Once we receive an event, we will attach the respective handle.
        this.statusSubscriber = new CallbackAttributeSubscriber((eventType, attribute) => {
            this.onStatusAttributeEvent(eventType, attribute).catch(err => {
                Logger.error("Error in onStatusAttributeEvent", err);
            });
        });

        for (const item of STATUS_ATTR_TO_HANDLE_MAPPING) {
            this.robot.state.subscribe(this.statusSubscriber, item.matcher);
        }

        // Attach vacuum.mqtt Hass component
        this.controller.withHass((hass) => {
            this.attachHomeAssistantComponent(
                new VacuumHassComponent({
                    hass: hass,
                    robot: this.robot
                })
            );
        });
    }

    /**
     * Register status handles when their status is published for the first time.
     *
     * @private
     * @param {string} eventType
     * @param {import("../../entities/Attribute")} attribute
     * @return {Promise<void>}
     */
    async onStatusAttributeEvent(eventType, attribute) {
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

        const matchingMatchers = matchingMappings.map(item => {
            return item.matcher;
        });
        const matchingHandles = matchingMappings.map(item => {
            return item.handle;
        });

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

            if (this.controller.isConnected) {
                await this.deconfigure({
                    cleanHomie: false,
                    unsubscribe: false
                });

                await this.configure();
            } else {
                Logger.debug("Skipping (de)configure on robot status attribute discovery, as we're not connected to MQTT.");
            }
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
            "$nodes": this.children.map(p => {
                return p.topicName;
            }).join(","),
            "$extensions": "",
            "$implementation": "Valetudo"
        };
    }

    async refresh() {
        try {
            await this.robot.pollState();
        } catch (e) {
            Logger.error("RobotMQTTHandle: Error while polling the robots state", e);
        }

        await super.refresh();
    }

    /**
     * Map handle needs special handling since map event callbacks can't be removed. Therefore the MqttController will
     * subscribe to it and call back the currently configured map handle.
     *
     * @public
     * @return {null|MapNodeMqttHandle}
     */
    getMapHandle() {
        return this.mapHandle;
    }

    /**
     * Same as getMapHandle()
     *
     * @public
     * @return {null|ValetudoEventsNodeMqttHandle}
     */
    getValetudoEventsHandle() {
        return this.valetudoEventsHandle;
    }
}

module.exports = RobotMqttHandle;
