const CleanSummaryCapability = require("../../../core/capabilities/CleanSummaryCapability");

const CleanSummaryAttribute = require("../../../entities/state/attributes/CleanSummaryAttribute");

class RoborockCleanSummaryCapability extends CleanSummaryCapability {
    /**
     * This function polls the cleaning summary and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<import("../../../entities/state/attributes/CleanSummaryAttribute")>}
     */
    async getCleanSummary() {
        const data = await this.robot.sendCommand("get_clean_summary", [], {});

        const CleanSummary = 
            new CleanSummaryAttribute({
                area: {
                    value: (data[1] / 1000000),
                    unit: CleanSummaryAttribute.UNITS.SQUARE_METRES
                },
                hours: {
                    value: Math.round(data[0] / 60),
                    unit: CleanSummaryAttribute.UNITS.MINUTES
                },
                count: {
                    value: data[2]
                }
            });

        return CleanSummary;
    }
}

module.exports = RoborockCleanSummaryCapability;