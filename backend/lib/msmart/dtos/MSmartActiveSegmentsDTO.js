const MSmartDTO = require("./MSmartDTO");

class MSmartActiveSegmentsDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {Array<number>} data.segmentIds
     */
    constructor(data) {
        super();

        /** @type {number[]} */
        this.segmentIds = data.segmentIds;

        Object.freeze(this);
    }
}

module.exports = MSmartActiveSegmentsDTO;
