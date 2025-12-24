const MapSegmentMaterialControlCapability = require("../../../core/capabilities/MapSegmentMaterialControlCapability");

/**
 * @extends MapSegmentMaterialControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMapSegmentMaterialControlCapability extends MapSegmentMaterialControlCapability {
    /**
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {import("../../../core/capabilities/MapSegmentMaterialControlCapability").MapLayerMaterial} material
     * @returns {Promise<void>}
     */
    async setMaterial(segment, material) {
        let roborockMaterialId;
        let direction;

        switch (material) {
            case MapSegmentMaterialControlCapability.MATERIAL.GENERIC:
                roborockMaterialId = 0;
                break;
            case MapSegmentMaterialControlCapability.MATERIAL.TILE:
                roborockMaterialId = 4;
                break;
            case MapSegmentMaterialControlCapability.MATERIAL.WOOD:
                roborockMaterialId = 3;
                break;
            case MapSegmentMaterialControlCapability.MATERIAL.WOOD_HORIZONTAL:
                roborockMaterialId = 3;
                direction = 0;
                break;
            case MapSegmentMaterialControlCapability.MATERIAL.WOOD_VERTICAL:
                roborockMaterialId = 3;
                direction = 90;
                break;
            default:
                throw new Error(`Unsupported material '${material}'`);
        }

        const roomParams = [parseInt(segment.id), roborockMaterialId];
        if (direction !== undefined) {
            roomParams.push(direction);
        }

        await this.robot.sendCommand("set_segment_ground_material", [roomParams], {timeout: 2500});

        this.robot.pollMap();
    }

    getProperties() {
        return {
            supportedMaterials: [
                MapSegmentMaterialControlCapability.MATERIAL.GENERIC,
                MapSegmentMaterialControlCapability.MATERIAL.WOOD_HORIZONTAL,
                MapSegmentMaterialControlCapability.MATERIAL.WOOD_VERTICAL,
                MapSegmentMaterialControlCapability.MATERIAL.TILE
            ]
        };
    }
}

module.exports = RoborockMapSegmentMaterialControlCapability;
