const DreameMiotHelper = require("../DreameMiotHelper");
const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../DreameValetudoRobot")>
 */
class DreamePersistentMapControlCapability extends PersistentMapControlCapability {

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

module.exports = DreamePersistentMapControlCapability;
