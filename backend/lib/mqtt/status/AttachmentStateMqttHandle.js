const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const stateAttrs = require("../../entities/state/attributes");

class AttachmentStateMqttHandle extends RobotStateNodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "AttachmentStateAttribute",
            friendlyName: "Attachment state",
            type: "Status"
        }));

        for (const attachment of options.robot.getModelDetails().supportedAttachments) {
            this.registerChild(new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: attachment,
                friendlyName: ATTACHMENT_FRIENDLY_NAME[attachment] ?? "Unknown",
                datatype: DataType.BOOLEAN,
                getter: async () => {
                    return this.isAttached(attachment);
                },
                helpText: `This handle reports whether the ${ATTACHMENT_FRIENDLY_NAME[attachment].toLowerCase()} attachment is installed.`
            }).also((prop) => {
                this.controller.withHass((hass => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: `${attachment}_attachment`,
                            friendlyName: `${ATTACHMENT_FRIENDLY_NAME[attachment]} attachment`,
                            componentType: ComponentType.BINARY_SENSOR,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                payload_off: "false",
                                payload_on: "true",
                                entity_category: EntityCategory.DIAGNOSTIC
                            }
                        })
                    );
                }));
            }));
        }
    }

    /**
     * @private
     * @param {string} attachment
     * @return {boolean}
     */
    isAttached(attachment) {
        const attachmentState = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: attachment
        });

        if (attachmentState === null) {
            return false;
        }

        return attachmentState.attached;
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.AttachmentStateAttribute.name}];
    }
}

const ATTACHMENT_FRIENDLY_NAME = Object.freeze({
    [stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN]: "Dust bin",
    [stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK]: "Water tank",
    [stateAttrs.AttachmentStateAttribute.TYPE.MOP]: "Mop"
});

module.exports = AttachmentStateMqttHandle;
