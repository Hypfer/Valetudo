const MSmartDTO = require("./MSmartDTO");

class MSmartDndConfigurationDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {boolean} data.enabled
     * 
     * @param {object} data.start
     * @param {number} data.start.hour
     * @param {number} data.start.minute
     * 
     * @param {object} data.end
     * @param {number} data.end.hour
     * @param {number} data.end.minute
     */
    constructor(data) {
        super();

        this.enabled = data.enabled;
        this.start = data.start;
        this.end = data.end;

        Object.freeze(this);
    }
}

module.exports = MSmartDndConfigurationDTO;
