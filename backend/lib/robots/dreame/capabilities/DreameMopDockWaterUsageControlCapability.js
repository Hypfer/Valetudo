const DreameMiotHelper = require("../DreameMiotHelper");
const DreameUtils = require("../DreameUtils");
const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");

/**
 * @extends WaterUsageControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockWaterUsageControlCapability extends WaterUsageControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * @param {Array<import("../../../entities/core/ValetudoSelectionPreset")>} options.presets
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
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            const res = await this.helper.readProperty(this.siid, this.piid);

            const deserializedResponse = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(res);

            return this.helper.writeProperty(
                this.siid,
                this.piid,
                DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
                    waterGrade: matchedPreset.value,
                    padCleaningFrequency: deserializedResponse.padCleaningFrequency,
                    operationMode: deserializedResponse.operationMode
                })
            );
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = DreameMopDockWaterUsageControlCapability;
