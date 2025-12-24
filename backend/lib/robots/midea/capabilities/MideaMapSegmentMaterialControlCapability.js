const MapSegmentMaterialControlCapability = require("../../../core/capabilities/MapSegmentMaterialControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MapSegmentMaterialControlCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentMaterialControlCapability extends MapSegmentMaterialControlCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {import("../../../core/capabilities/MapSegmentMaterialControlCapability").MapLayerMaterial} material
     * @returns {Promise<void>}
     */
    async setMaterial(segment, material) {
        const segments = this.robot.state.map.getSegments();

        const segmentMaterialMap = {};
        for (const _segment of segments) {
            segmentMaterialMap[_segment.id] = _segment.material;
        }

        segmentMaterialMap[segment.id] = material;

        const segmentCount = segments.length;

        const payload = Buffer.alloc(1 + (segmentCount * 2));
        payload[0] = segmentCount;

        let offset = 1;
        for (const _segment of segments) {
            let rawMaterialType;
            switch (segmentMaterialMap[_segment.id]) {
                case MideaMapSegmentMaterialControlCapability.MATERIAL.GENERIC:
                    rawMaterialType = 0;
                    break;
                case MideaMapSegmentMaterialControlCapability.MATERIAL.WOOD:
                    rawMaterialType = 2;
                    break;
                case MideaMapSegmentMaterialControlCapability.MATERIAL.TILE:
                    rawMaterialType = 3;
                    break;
            }

            if (rawMaterialType === undefined) {
                throw new Error(`Unhandled material ${segmentMaterialMap[_segment.id]}`);
            }


            payload[offset] = parseInt(_segment.id);
            payload[offset+1] = rawMaterialType;

            offset = offset + 2;
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_FLOOR_TYPE,
                payload
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        if (response.payload[3] !== 0x00) {
            throw new Error("Set floor type failed.");
        } // TODO: should I do this with every command?


        this.robot.pollMap();
        await sleep(2_000);
    }

    getProperties() {
        return {
            supportedMaterials: [
                MideaMapSegmentMaterialControlCapability.MATERIAL.GENERIC,
                MideaMapSegmentMaterialControlCapability.MATERIAL.WOOD,
                MideaMapSegmentMaterialControlCapability.MATERIAL.TILE,
            ]
        };
    }
}

module.exports = MideaMapSegmentMaterialControlCapability;
