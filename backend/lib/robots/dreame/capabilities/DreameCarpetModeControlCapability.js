const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");

/**
 * @extends CarpetModeControlCapability<import("../DreameValetudoRobot")>
 */
class DreameCarpetModeControlCapability extends CarpetModeControlCapability {

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
     * This function polls the current carpet mode state
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
        await this.helper.writeProperty(this.siid, this.piid, 1);
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.helper.writeProperty(this.siid, this.piid, 0);
    }
}

module.exports = DreameCarpetModeControlCapability;
