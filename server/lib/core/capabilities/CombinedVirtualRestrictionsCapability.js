const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");
const ValetudoVirtualRestrictions = require("../../entities/core/ValetudoVirtualRestrictions");
const ValetudoVirtualWall = require("../../entities/core/ValetudoVirtualWall");

const entities = require("../../entities");

/**
 * To avoid a race condition on robots where both walls and zones are the same data type
 * this capability is both.
 *
 * Honestly, every robot should be like this. Only supporting one of the two is questionable
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class CombinedVirtualRestrictionsCapability extends Capability {
    /**
     *
     * @param {object} options
     * @param {T} options.robot
     * @param {Array<import("../../entities/core/ValetudoRestrictedZone").ValetudoRestrictedZoneType>} [options.supportedRestrictedZoneTypes]
     * @class
     */
    constructor(options) {
        super(options);

        this.supportedRestrictedZoneTypes = options.supportedRestrictedZoneTypes ?? [ValetudoRestrictedZone.TYPE.REGULAR];
    }

    /**
     * @returns {Promise<import("../../entities/core/ValetudoVirtualRestrictions")>}
     */
    async getVirtualRestrictions() {
        const virtualWalls = [];
        const restrictedZones = [];


        this.robot.state.map.entities.filter(e => {
            return (e instanceof entities.map.LineMapEntity && e.type === entities.map.LineMapEntity.TYPE.VIRTUAL_WALL) ||
                (e instanceof entities.map.PolygonMapEntity && e.type === entities.map.PolygonMapEntity.TYPE.NO_GO_AREA) ||
                (e instanceof entities.map.PolygonMapEntity && e.type === entities.map.PolygonMapEntity.TYPE.NO_MOP_AREA);
        }).forEach(restriction => {
            if (restriction instanceof entities.map.LineMapEntity) {
                virtualWalls.push(new ValetudoVirtualWall({
                    points: {
                        pA: {
                            x: restriction.points[0],
                            y: restriction.points[1]
                        },
                        pB: {
                            x: restriction.points[1],
                            y: restriction.points[2]
                        }
                    }
                }));
            } else if (restriction instanceof entities.map.PolygonMapEntity) {
                let type;

                switch (restriction.type) {
                    case entities.map.PolygonMapEntity.TYPE.NO_GO_AREA:
                        type = ValetudoRestrictedZone.TYPE.REGULAR;
                        break;
                    case entities.map.PolygonMapEntity.TYPE.NO_MOP_AREA:
                        type = ValetudoRestrictedZone.TYPE.MOP;
                        break;
                }

                restrictedZones.push(new ValetudoRestrictedZone({
                    points: {
                        pA: {
                            x: restriction.points[0],
                            y: restriction.points[1]
                        },
                        pB: {
                            x: restriction.points[1],
                            y: restriction.points[2]
                        },
                        pC: {
                            x: restriction.points[3],
                            y: restriction.points[4]
                        },
                        pD: {
                            x: restriction.points[5],
                            y: restriction.points[6]
                        }
                    },
                    type: type
                }));
            }
        });

        return new ValetudoVirtualRestrictions({
            virtualWalls: virtualWalls,
            restrictedZones: restrictedZones
        });
    }

    /**
     *
     * @param {import("../../entities/core/ValetudoVirtualRestrictions")} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        throw new NotImplementedError();
    }

    /**
     * @returns {CombinedVirtualRestrictionsCapabilityProperties}
     */
    getProperties() {
        return {
            supportedRestrictedZoneTypes: this.supportedRestrictedZoneTypes
        };
    }

    getType() {
        return CombinedVirtualRestrictionsCapability.TYPE;
    }
}

CombinedVirtualRestrictionsCapability.TYPE = "CombinedVirtualRestrictionsCapability";

module.exports = CombinedVirtualRestrictionsCapability;

/**
 * @typedef {object} CombinedVirtualRestrictionsCapabilityProperties
 *
 * @property {Array<import("../../entities/core/ValetudoRestrictedZone").ValetudoRestrictedZoneType>} supportedRestrictedZoneTypes
 */
