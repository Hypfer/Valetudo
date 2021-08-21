const DataType = require("../homie/DataType");
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

        for (const attachment of Object.values(stateAttrs.AttachmentStateAttribute.TYPE)) {
            this.registerChild(new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: attachment,
                friendlyName: ATTACHMENT_FRIENDLY_NAME[attachment] ?? "Unknown",
                datatype: DataType.BOOLEAN,
                getter: async () => {
                    return this.isAttached(attachment);
                },
                helpText: "This handle reports whether the " + ATTACHMENT_FRIENDLY_NAME[attachment].toLowerCase() +
                    " is installed. Attachments not compatible with your robot may be included (but set to `false`)" +
                    " and you can safely ignore them."
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
