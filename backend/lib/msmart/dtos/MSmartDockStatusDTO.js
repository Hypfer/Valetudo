const MSmartDTO = require("./MSmartDTO");

class MSmartDockStatusDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.dust_collection_count
     * @param {boolean} data.fluid_1_ok
     * @param {boolean} data.fluid_2_ok
     */
    constructor(data) {
        super();

        this.dust_collection_count = data.dust_collection_count;
        this.fluid_1_ok = data.fluid_1_ok;
        this.fluid_2_ok = data.fluid_2_ok;

        Object.freeze(this);
    }
}

module.exports = MSmartDockStatusDTO;
