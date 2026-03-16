const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const MopTwistControlCapability = require("../../../core/capabilities/MopTwistControlCapability");

/**
 * @extends MopTwistControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopTwistControlCapabilityV2 extends MopTwistControlCapability {

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

        return deserializedResponse.LacuneMopScalable === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.miotHelper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                LacuneMopScalable: 1
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
                LacuneMopScalable: 0
            })
        );
    }
}

module.exports = DreameMopTwistControlCapabilityV2;
