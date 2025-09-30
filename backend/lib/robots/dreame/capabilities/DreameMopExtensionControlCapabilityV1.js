const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const MopExtensionControlCapability = require("../../../core/capabilities/MopExtensionControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MopExtensionControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopExtensionControlCapabilityV1 extends MopExtensionControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);

        // 1 => Automatic
        // 2 => Each cleanup
        // 7 => Every 7 days
        // + negative variants of those that all mean disabled
        return deserializedResponse.MopScalable > 0;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                MopScalable: 2
            })
        );

        await sleep(100); // Give the robot some time to think
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                MopScalable: -2
            })
        );

        await sleep(100); // Give the robot some time to think
    }
}

module.exports = DreameMopExtensionControlCapabilityV1;
