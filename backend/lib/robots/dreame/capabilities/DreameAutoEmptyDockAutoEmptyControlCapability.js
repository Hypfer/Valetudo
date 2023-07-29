const AutoEmptyDockAutoEmptyControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");

/**
 * @extends AutoEmptyDockAutoEmptyControlCapability<import("../DreameValetudoRobot")>
 */
class DreameAutoEmptyDockAutoEmptyControlCapability extends AutoEmptyDockAutoEmptyControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.SIID;
        this.piid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.AUTO_EMPTY_ENABLED.PIID;

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
        await this.helper.writeProperty(this.siid, this.piid, 1);
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.helper.writeProperty(this.siid, this.piid, 0);
    }
}

module.exports = DreameAutoEmptyDockAutoEmptyControlCapability;
