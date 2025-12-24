const MapSegmentMaterialControlCapability = require("../../../core/capabilities/MapSegmentMaterialControlCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");

/**
 * @extends MapSegmentMaterialControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMapSegmentMaterialControlCapability extends MapSegmentMaterialControlCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * 
     * @param {Array<import("../../../core/capabilities/MapSegmentMaterialControlCapability").MapLayerMaterial>} options.supportedMaterials
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mapDetails
     * @param {number} options.miot_properties.mapDetails.piid
     * @param {object} options.miot_properties.actionResult
     * @param {number} options.miot_properties.actionResult.piid
     *
     */
    constructor(options) {
        super(options);

        this.supportedMaterials = options.supportedMaterials;

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {import("../../../core/capabilities/MapSegmentMaterialControlCapability").MapLayerMaterial} material
     * @returns {Promise<void>}
     */
    async setMaterial(segment, material) {
        if (!this.supportedMaterials.includes(material)) {
            throw new Error(`Unsupported material '${material}'.`);
        }

        let mappedMaterial;
        let direction;
        switch (material) {
            case DreameMapSegmentMaterialControlCapability.MATERIAL.GENERIC:
                mappedMaterial = 0;
                break;
            case DreameMapSegmentMaterialControlCapability.MATERIAL.WOOD:
                mappedMaterial = 1;
                break;
            case DreameMapSegmentMaterialControlCapability.MATERIAL.WOOD_HORIZONTAL:
                mappedMaterial = 1;
                direction = 0;
                break;
            case DreameMapSegmentMaterialControlCapability.MATERIAL.WOOD_VERTICAL:
                mappedMaterial = 1;
                direction = 90;
                break;
            case DreameMapSegmentMaterialControlCapability.MATERIAL.TILE:
                mappedMaterial = 2;
                break;
            default:
                throw new Error(`Unsupported material '${material}'.`);

        }

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            nsm: {
                                [segment.id]: {
                                    material: mappedMaterial,
                                    direction: direction
                                }
                            }
                        })
                    }
                ]
            },
            {timeout: 5000}
        );

        if (
            res && res.siid === this.miot_actions.map_edit.siid &&
            res.aiid === this.miot_actions.map_edit.aiid &&
            Array.isArray(res.out) && res.out.length === 1 &&
            res.out[0].piid === this.miot_properties.actionResult.piid
        ) {
            switch (res.out[0].value) {
                case 0:
                    this.robot.pollMap();
                    return;
                default:
                    throw new RobotFirmwareError("Got error " + res.out[0].value + " while setting segment material.");
            }
        }
    }

    getProperties() {
        return {
            supportedMaterials: this.supportedMaterials
        };
    }
}

module.exports = DreameMapSegmentMaterialControlCapability;
