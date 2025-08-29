const MSmartDTO = require("./MSmartDTO");

class MSmartErrorDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.error_type
     * @param {number} data.error_desc
     * @param {number} data.sta_index - FIXME: figure out what this means
     */
    constructor(data) {
        super();

        this.error_type = data.error_type;
        this.error_desc = data.error_desc;
        this.sta_index = data.sta_index;

        Object.freeze(this);
    }
}

module.exports = MSmartErrorDTO;
