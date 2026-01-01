const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const IntensiveMoppingPathControlCapability = require("../../../core/capabilities/IntensiveMoppingPathControlCapability");
/**
 * @extends IntensiveMoppingPathControlCapability<import("../DreameValetudoRobot")>
 */
class DreameIntensiveMoppingPathControlCapabilityV1 extends IntensiveMoppingPathControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.TIGHT_MOP_PATTERN.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        return res === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            1
        );
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            0
        );
    }
}

module.exports = DreameIntensiveMoppingPathControlCapabilityV1;
