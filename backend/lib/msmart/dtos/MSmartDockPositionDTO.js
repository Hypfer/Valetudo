const MSmartDTO = require("./MSmartDTO");

class MSmartDockPositionDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {boolean} data.valid
     * @param {number} data.x
     * @param {number} data.y
     * @param {number} data.angle
     */
    constructor(data) {
        super();

        this.valid = data.valid;
        this.x = data.x;
        this.y = data.y;
        this.angle = data.angle;

        Object.freeze(this);
    }
}

module.exports = MSmartDockPositionDTO;
