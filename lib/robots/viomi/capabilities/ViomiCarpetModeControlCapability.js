const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");
const stateAttrs = require("../../../entities/state/attributes");

class ViomiCarpetModeControlCapability extends CarpetModeControlCapability {
    /**
     * This function returns the last set carpet turbo mode setting..
     * Viomi does not have a command to retrieve the current setting, so we fail if it was not set recently.
     *
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const state = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.CarpetTurboStateAttribute);
        if (state === null) {
            throw new Error("Carpet turbo state cannot be remembered by Valetudo. " +
                "If you don't remember what you set it to, set it again.");
        }
        return state.value === stateAttrs.CarpetTurboStateAttribute.VALUE.ENABLED;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        this.robot.state.upsertFirstMatchingAttribute(new stateAttrs.CarpetTurboStateAttribute({
            value: stateAttrs.CarpetTurboStateAttribute.VALUE.ENABLED
        }));

        // 0: off, 1: medium, 2: turbo
        await this.robot.sendCommand("set_carpetturbo", [2], {});
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        this.robot.state.upsertFirstMatchingAttribute(new stateAttrs.CarpetTurboStateAttribute({
            value: stateAttrs.CarpetTurboStateAttribute.VALUE.DISABLED
        }));

        await this.robot.sendCommand("set_carpetturbo", [0], {});
    }
}

module.exports = ViomiCarpetModeControlCapability;
