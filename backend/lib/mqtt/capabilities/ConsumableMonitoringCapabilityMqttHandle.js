const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const stateAttrs = require("../../entities/state/attributes");
const Unit = require("../common/Unit");
const {Commands} = require("../common");
const {MqttController} = require("../index");

class ConsumableMonitoringCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/ConsumableMonitoringCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Consumables monitoring",
            helpMayChange: {
                "Properties": "Consumables depend on the robot model and may be discovered at runtime. Always look" +
                    " for changes in `$properties` while `$state` is `init`.",
                "Property datatype and units": "Some robots send consumables as remaining time, others send them as " +
                    "endurance percent remaining.",
            }
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "refresh",
                friendlyName: "Refresh consumables",
                datatype: DataType.ENUM,
                format: Commands.BASIC.PERFORM,
                setter: async (value) => {
                    await this.capability.getConsumables();
                },
                helpText: "If set to `" + Commands.BASIC.PERFORM + "`, it will attempt to refresh the consumables " +
                    "from the robot. Note that there's no need to do it manually, consumables are refreshed " +
                    "automatically every 30 seconds by default.",
            })
        );

        this.registeredConsumables = [];
        this.lastGetConsumables = 0;
    }

    /**
     * @private
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute")} attribute
     * @return {string}
     */
    genConsumableTopicId(attribute) {
        let name = attribute.type;
        if (attribute.subType !== stateAttrs.ConsumableStateAttribute.SUB_TYPE.NONE) {
            name += "-" + attribute.subType;
        }
        return name;
    }

    /**
     * @private
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute")} attribute
     * @return {string}
     */
    genConsumableFriendlyName(attribute) {
        let name = "";
        if (attribute.subType !== stateAttrs.ConsumableStateAttribute.SUB_TYPE.NONE && attribute.subType !== stateAttrs.ConsumableStateAttribute.SUB_TYPE.ALL) {
            name += SUBTYPE_MAPPING[attribute.subType] + " ";
        }
        name += TYPE_MAPPING[attribute.type];
        return name;
    }

    /**
     * @private
     * @param {string} topicId
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute")} attr
     * @return {Promise<void>}
     */
    async addNewConsumable(topicId, attr) {
        this.registeredConsumables.push(topicId);

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: topicId,
                friendlyName: this.genConsumableFriendlyName(attr),
                datatype: attr.remaining.unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? DataType.INTEGER : DataType.DURATION,
                unit: attr.remaining.unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? Unit.PERCENT : undefined,
                format: attr.remaining.unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? "0:100" : undefined,
                getter: async () => {
                    const newAttr = this.robot.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.ConsumableStateAttribute.name,
                        attributeType: attr.type,
                        attributeSubType: attr.subType
                    });

                    if (newAttr) {
                        // Raw value for Home Assistant
                        await HassAnchor.getAnchor(HassAnchor.ANCHOR.CONSUMABLE_VALUE + topicId).post(newAttr.remaining.value);

                        // Convert value to seconds for Homie
                        return newAttr.remaining.value * (attr.remaining.unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? 1 : 60);
                    }

                    return null;
                },
                helpText: attr.remaining.unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ?
                    "This handle returns the consumable remaining endurance percentage." :
                    "This handle returns the consumable remaining endurance time as an ISO8601 duration. " +
                    "The controlled Home Assistant component will report it as seconds instead."
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: this.capability.getType() + "_" + topicId.replace("-", "_"),
                            friendlyName: this.genConsumableFriendlyName(attr),
                            componentType: ComponentType.SENSOR,
                            baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_CONSUMABLE_STATE + topicId),
                            autoconf: {
                                state_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_CONSUMABLE_STATE + topicId),
                                unit_of_measurement: attr.remaining.unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? "Percent" : "Minutes",
                                icon: "mdi:progress-wrench",
                            },
                            topics: {
                                "": HassAnchor.getAnchor(HassAnchor.ANCHOR.CONSUMABLE_VALUE + topicId)
                            }
                        })
                    );
                });
            })
        );
    }

    async findNewConsumables() {
        const consumables = this.robot.state.getMatchingAttributes(this.getInterestingStatusAttributes()[0]);
        const newConsumables = {};
        for (const attr of consumables) {
            const topicId = this.genConsumableTopicId(attr);
            if (!this.registeredConsumables.includes(topicId)) {
                newConsumables[topicId] = attr;
            }
        }
        if (Object.keys(newConsumables).length > 0) {
            await this.controller.reconfigure(async () => {
                await this.deconfigure({
                    cleanHomie: false,
                    cleanHass: false,
                });

                for (const [topicId, attr] of Object.entries(newConsumables)) {
                    await this.addNewConsumable(topicId, attr);
                }

                await this.configure();
            });
        }
    }

    async refresh() {
        await this.findNewConsumables();
        await super.refresh();

        // Warning: hack
        // Avoid causing a recursion chain (newly added consumables will cause refresh to be called)
        if (this.lastGetConsumables + MqttController.REFRESH_INTERVAL > Date.now()) {
            return;
        }
        this.lastGetConsumables = Date.now();

        setTimeout(() => {
            this.capability.getConsumables().catch((reason => {
                Logger.warn("Failed to get consumables:", reason);
            }));
        }, 10000);
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.ConsumableStateAttribute.name}];
    }
}

const TYPE_MAPPING = Object.freeze({
    "brush": "Brush",
    "filter": "Filter",
    "sensor": "Sensor cleaning",
    "mop": "Mop"
});

const SUBTYPE_MAPPING = Object.freeze({
    "main": "Main",
    "side_right": "Right",
    "side_left": "Left",
    "all": "",
    "none": ""
});


module.exports = ConsumableMonitoringCapabilityMqttHandle;
