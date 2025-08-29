const MSmartDTO = require("./MSmartDTO");

/**
 * @typedef {object} MideaMapPoint
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} MideaActiveZone
 * @property {number} index
 * @property {number} passes
 * @property {MideaMapPoint} pA - top-left
 * @property {MideaMapPoint} pC - bottom-right
 */

/**
 * @typedef {object} MideaActiveZonesData
 * @property {MideaActiveZone[]} zones
 */


/**
 * @class MSmartActiveZonesDTO
 * @extends MSmartDTO
 */
class MSmartActiveZonesDTO extends MSmartDTO {
    /**
     * @param {MideaActiveZonesData} data
     */
    constructor(data) {
        super();

        /** @type {MideaActiveZone[]} */
        this.zones = data.zones;

        Object.freeze(this);
    }
}

module.exports = MSmartActiveZonesDTO;
