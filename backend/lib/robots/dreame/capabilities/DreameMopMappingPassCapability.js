const DreameMappingPassCapability = require("./DreameMappingPassCapability");
const stateAttrs = require("../../../entities/state/attributes");

class DreameMopMappingPassCapability extends DreameMappingPassCapability {
    /*
        This is a workaround for an issue with W10 Firmware 1092 that causes the robot to do nothing at all
        when the mop pads are attached. It will hopefully be removed in the future
     */

    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        const mopAttachmentState = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
        });

        if (mopAttachmentState?.attached === false) {
            return super.startMapping();
        } else {
            throw new Error("The mop pads need to be detached");
        }
    }
}

module.exports = DreameMopMappingPassCapability;
