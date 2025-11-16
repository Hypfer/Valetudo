const MSmartDTO = require("./MSmartDTO");

class MSmartMopDockSettingsDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.mode Should always be 0 I think? 1 might've at some point been per-room?
     * @param {number} data.general_backwash_area in m²
     * @param {number} data.general_cleaning_mode
     * @param {number} data.custom_backwash_area unused, needs to be written back
     * @param {number} data.custom_cleaning_mode unused, needs to be written back
     */
    constructor(data) {
        super();

        this.mode = data.mode;
        this.general_backwash_area = data.general_backwash_area;
        this.general_cleaning_mode = data.general_cleaning_mode;

        this.custom_backwash_area = data.custom_backwash_area;
        this.custom_cleaning_mode = data.custom_cleaning_mode;

        Object.freeze(this);
    }
}

module.exports = MSmartMopDockSettingsDTO;
