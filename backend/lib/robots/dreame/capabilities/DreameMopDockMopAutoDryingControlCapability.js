const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const MopDockMopAutoDryingControlCapability = require("../../../core/capabilities/MopDockMopAutoDryingControlCapability");

/**
 * @extends MopDockMopAutoDryingControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockMopAutoDryingControlCapability extends MopDockMopAutoDryingControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID;
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.miotHelper.readProperty(this.siid, this.piid);
        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);

        return deserializedResponse.AutoDry === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.miotHelper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                AutoDry: 1
            })
        );
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.miotHelper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                AutoDry: 0
            })
        );
    }
}

module.exports = DreameMopDockMopAutoDryingControlCapability;
