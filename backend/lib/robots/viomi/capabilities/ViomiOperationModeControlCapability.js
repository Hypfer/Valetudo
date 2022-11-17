const OperationModeControlCapability = require("../../../core/capabilities/OperationModeControlCapability");

/**
 * @extends OperationModeControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiOperationModeControlCapability extends OperationModeControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            await this.robot.sendCommand("set_mop", [matchedPreset.value]);
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = ViomiOperationModeControlCapability;
