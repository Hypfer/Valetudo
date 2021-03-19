/**
 * @typedef {import("./ValetudoVirtualWall")} ValetudoVirtualWall
 * @typedef {import("./ValetudoRestrictedZone")} ValetudoRestrictedZone
 */

const SerializableEntity = require("../SerializableEntity");


// noinspection JSUnusedGlobalSymbols
/**
 * @class ValetudoZonePreset
 * @property {Array<ValetudoVirtualWall>} virtualWalls
 * @property {Array<ValetudoRestrictedZone>} restrictedZones
 */
class ValetudoZonePreset extends SerializableEntity {
    /**
     * This is a named container which contains RestrictedZones and virtualWalls
     *
     * @param {object} options
     * @param {Array<ValetudoVirtualWall>} options.virtualWalls
     * @param {Array<ValetudoRestrictedZone>} options.restrictedZones
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.virtualWalls = options.virtualWalls;
        this.restrictedZones = options.restrictedZones;
    }
}

module.exports = ValetudoZonePreset;
