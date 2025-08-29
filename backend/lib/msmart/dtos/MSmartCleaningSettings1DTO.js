const MSmartDTO = require("./MSmartDTO");

// FIXME: naming

class MSmartCleaningSettings1DTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.route_type 
     * @param {number} data.cut_hair_level 0-2
     * @param {number} data.collect_suction_level  0-1
     * @param {boolean} data.exhibition_switch 
     * @param {number} data.ai_grade_avoidance_mode
     * @param {boolean} data.cut_hair_super_switch 
     * @param {number} data.turbidity_re_mop_switch 
     */
    constructor(data) {
        super();

        this.route_type = data.route_type;
        this.cut_hair_level = data.cut_hair_level;
        this.collect_suction_level = data.collect_suction_level;
        this.exhibition_switch = data.exhibition_switch;
        this.ai_grade_avoidance_mode = data.ai_grade_avoidance_mode;
        this.cut_hair_super_switch = data.cut_hair_super_switch;
        this.turbidity_re_mop_switch = data.turbidity_re_mop_switch;

        Object.freeze(this);
    }
}

module.exports = MSmartCleaningSettings1DTO;
