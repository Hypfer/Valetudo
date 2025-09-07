const MSmartDTO = require("./MSmartDTO");

class MSmartCarpetBehaviorSettingsDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.carpet_behavior 0 = avoid, 1 = ignore, 2 = adapt, 3 = cross
     * @param {number} data.parameter_bitfield The raw bitfield byte for carpet sub-settings
     * @param {boolean} data.clean_carpet_first
     * @param {boolean} data.deep_carpet_cleaning
     * @param {boolean} data.carpet_suction_boost
     * @param {boolean} data.enhanced_carpet_avoidance
     */
    constructor(data) {
        super();

        this.carpet_behavior = data.carpet_behavior;
        this.parameter_bitfield = data.parameter_bitfield;
        this.clean_carpet_first = data.clean_carpet_first;
        this.deep_carpet_cleaning = data.deep_carpet_cleaning;
        this.carpet_suction_boost = data.carpet_suction_boost;
        this.enhanced_carpet_avoidance = data.enhanced_carpet_avoidance;

        Object.freeze(this);
    }
}

MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT = Object.freeze({
    CLEAN_CARPET_FIRST: 0b0001,
    DEEP_CARPET_CLEANING: 0b0010,
    CARPET_SUCTION_BOOST: 0b0100,
    ENHANCED_CARPET_AVOIDANCE: 0b1000
});

module.exports = MSmartCarpetBehaviorSettingsDTO;
