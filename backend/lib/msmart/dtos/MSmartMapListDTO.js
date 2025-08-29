const MSmartDTO = require("./MSmartDTO");

class MSmartMapListDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.currentMapId
     * @param {Array<number>} data.savedMapIds
     */
    constructor(data) {
        super();

        this.currentMapId = data.currentMapId;
        this.savedMapIds = data.savedMapIds;

        Object.freeze(this);
    }
}

module.exports = MSmartMapListDTO;
