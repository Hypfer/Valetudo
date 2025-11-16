const MSmartDTO = require("./MSmartDTO");

class MSmartMopDockDryingSettingsDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} data.mode 5 = 2h, 6 = 3h, 7 = 6h no heater || 3 = quiet, 4 = "cool", 0 and 1 unclear
     * @param {number} data.time_remaining probably seconds
     */
    constructor(data) {
        super();

        this.mode = data.mode;
        this.time_remaining = data.time_remaining;

        Object.freeze(this);
    }
}

module.exports = MSmartMopDockDryingSettingsDTO;
