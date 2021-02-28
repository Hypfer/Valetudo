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
        // Disclaimer: nasty
        // noinspection JSUnresolvedVariable
        const state = this.robot.carpetModeEnabled;
        if (state === null || state === undefined) {
            throw new Error("Unknown carpet turbo state");
        }
        return state;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        this.robot.carpetModeEnabled = true;
        // 0: off, 1: medium, 2: turbo
        await this.robot.sendCommand("set_carpetturbo", [2], {});
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        this.robot.carpetModeEnabled = false;
        await this.robot.sendCommand("set_carpetturbo", [0], {});
    }
}

module.exports = ViomiCarpetModeControlCapability;
