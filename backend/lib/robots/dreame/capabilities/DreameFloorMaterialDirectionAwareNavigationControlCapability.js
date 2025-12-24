const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const FloorMaterialDirectionAwareNavigationControlCapability = require("../../../core/capabilities/FloorMaterialDirectionAwareNavigationControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends FloorMaterialDirectionAwareNavigationControlCapability<import("../DreameValetudoRobot")>
 */
class DreameFloorMaterialDirectionAwareNavigationControlCapability extends FloorMaterialDirectionAwareNavigationControlCapability {

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

        return deserializedResponse.MaterialDirectionClean === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                MaterialDirectionClean: 1
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
                MaterialDirectionClean: 0
            })
        );

        await sleep(100); // Give the robot some time to think
    }
}

module.exports = DreameFloorMaterialDirectionAwareNavigationControlCapability;
