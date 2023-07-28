const CollisionAvoidantNavigationControlCapability = require("../../../core/capabilities/CollisionAvoidantNavigationControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameUtils = require("../DreameUtils");

/**
 * @extends CollisionAvoidantNavigationControlCapability<import("../DreameValetudoRobot")>
 */
class DreameCollisionAvoidantNavigationControlCapability extends CollisionAvoidantNavigationControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.piid MIOT Property ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.piid = options.piid;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);

        return deserializedResponse.LessColl === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                LessColl: 1
            })
        );
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                LessColl: 0
            })
        );
    }
}

module.exports = DreameCollisionAvoidantNavigationControlCapability;
