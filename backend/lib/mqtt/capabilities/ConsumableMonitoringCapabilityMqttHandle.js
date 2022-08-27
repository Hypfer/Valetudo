const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const stateAttrs = require("../../entities/state/attributes");
const Unit = require("../common/Unit");

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
                "Properties": "Consumables depend on the robot model.",
                "Property datatype and units": "Some robots send consumables as remaining time, others send them as " +
                    "endurance percent remaining.",
            }
        }));
        this.capability = options.capability;

        this.capability.getProperties().availableConsumables.forEach(consumable => {
            this.addNewConsumable(
                this.genConsumableTopicId(consumable.type, consumable.subType),
                consumable.type,
                consumable.subType,
                consumable.unit
            );
        });
    }

    /**
     * @private
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").TYPE} type
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").SUB_TYPE} subType
     * @return {string}
     */
    genConsumableTopicId(type, subType) {
        let name = type;
        if (subType !== stateAttrs.ConsumableStateAttribute.SUB_TYPE.NONE) {
            name += "-" + subType;
        }
        return name;
    }

    /**
     * @private
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").TYPE} type
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").SUB_TYPE} subType
     * @return {string}
     */
    genConsumableFriendlyName(type, subType) {
        let name = "";
        if (subType !== stateAttrs.ConsumableStateAttribute.SUB_TYPE.NONE && subType !== stateAttrs.ConsumableStateAttribute.SUB_TYPE.ALL) {
            name += SUBTYPE_MAPPING[subType] + " ";
        }
        name += TYPE_MAPPING[type];
        return name;
    }

    /**
     * @private
     * @param {string} topicId
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").TYPE} type
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").SUB_TYPE} subType
     * @param {import("../../entities/state/attributes/ConsumableStateAttribute").UNITS} unit
     * @return {void}
     */
    addNewConsumable(topicId, type, subType, unit) {
        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: topicId,
                friendlyName: this.genConsumableFriendlyName(type, subType),
                datatype: DataType.INTEGER,
                unit: unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? Unit.PERCENT : undefined,
                format: unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? "0:100" : undefined,
                getter: async () => {
                    const newAttr = this.robot.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.ConsumableStateAttribute.name,
                        attributeType: type,
                        attributeSubType: subType
                    });

                    if (newAttr) {
                        // Raw value for Home Assistant
                        await HassAnchor.getAnchor(HassAnchor.ANCHOR.CONSUMABLE_VALUE + topicId).post(newAttr.remaining.value);

                        // Convert value to seconds for Homie
                        return newAttr.remaining.value * (unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? 1 : 60);
                    }

                    return null;
                },
                helpText: unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ?
                    "This handle returns the consumable remaining endurance percentage." :
                    "This handle returns the consumable remaining endurance time as an int representing seconds remaining."
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: this.capability.getType() + "_" + topicId.replace("-", "_"),
                            friendlyName: this.genConsumableFriendlyName(type, subType),
                            componentType: ComponentType.SENSOR,
                            baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_CONSUMABLE_STATE + topicId),
                            autoconf: {
                                state_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_CONSUMABLE_STATE + topicId),
                                unit_of_measurement: unit === stateAttrs.ConsumableStateAttribute.UNITS.PERCENT ? Unit.PERCENT : Unit.MINUTES,
                                icon: "mdi:progress-wrench",
                                entity_category: EntityCategory.DIAGNOSTIC
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

    async refresh() {
        await this.capability.getConsumables();
        await super.refresh();
    }

    onStatusSubscriberEvent() {
        /*
            We need to override this method as otherwise, we'd end up in an endless loop
            due to refresh() triggering a consumables poll triggering a statusAttribute update
            triggering a refresh() triggering a consumables poll...
         */
        super.refresh().then(() => { /* intentional */ }).catch(err => {
            Logger.error("Error during MqttHandle refresh", err);
        });
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
    "secondary": "Secondary",
    "side_right": "Right",
    "side_left": "Left",
    "all": "",
    "none": ""
});


module.exports = ConsumableMonitoringCapabilityMqttHandle;
