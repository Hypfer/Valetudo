const MapSegmentEditCapability = require("../../../core/capabilities/MapSegmentEditCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");
const ViomiMapParser = require("../ViomiMapParser");

/**
 * @extends MapSegmentEditCapability<import("../ViomiValetudoRobot")>
 */
class ViomiMapSegmentEditCapability extends MapSegmentEditCapability {
    /**
     *
     * @param {object} options
     * @param {import("../ViomiValetudoRobot")} options.robot
     *
     * @param {string} options.lang the default language for the generated room names
     *
     * @param {object} options.mapActions
     * @param {number} options.mapActions.JOIN_SEGMENT_TYPE
     * @param {number} options.mapActions.SPLIT_SEGMENT_TYPE
     *
     */
    constructor(options) {
        super(options);

        this.lang = options.lang;
        this.mapActions = options.mapActions;
    }

    /**
     * Rounds and formats a point for use in viomi params.
     *
     * @param {object} point
     * @param {number} point.x
     * @param {number} point.y
     */
    pointToViomiString(point) {
        const roundedX = Math.round((point.x + Number.EPSILON) * 100) / 100;
        const roundedY = Math.round((point.y + Number.EPSILON) * 100) / 100;
        return `${roundedX}_${roundedY}`;
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        if (this.robot.state.map?.metaData?.defaultMap === true) {
            throw new Error("Can't join segments because the map was not parsed yet");
        }

        try {
            const result = await this.robot.sendCommand("arrange_room", {
                lang: this.lang,
                mapId: this.robot.state.map.metaData.vendorMapId,
                roomArr: [[parseInt(segmentA.id), parseInt(segmentB.id)]],
                type: this.mapActions.JOIN_SEGMENT_TYPE
            }, {
                timeout: 5000
            });
            if (Array.isArray(result) && result.length === 1 && result[0] === "fail") {
                throw new RobotFirmwareError("Segments must be adjacent!");
            }
        } finally {
            this.robot.pollMap();
        }
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {object} pA
     * @param {number} pA.x
     * @param {number} pA.y
     * @param {object} pB
     * @param {number} pB.x
     * @param {number} pB.y
     * @returns {Promise<void>}
     */
    async splitSegment(segment, pA, pB) {
        if (this.robot.state.map?.metaData?.defaultMap === true) {
            throw new Error("Can't split segment because the map was not parsed yet");
        }

        try {
            const result = await this.robot.sendCommand("arrange_room", {
                lang: this.lang,
                mapId: this.robot.state.map.metaData.vendorMapId,
                pointArr: [[
                    1,
                    this.pointToViomiString(ViomiMapParser.positionToViomi(pA.x, pA.y)),
                    this.pointToViomiString(ViomiMapParser.positionToViomi(pB.x, pB.y))
                ]],
                roomId: parseInt(segment.id),
                type: this.mapActions.SPLIT_SEGMENT_TYPE
            }, {
                timeout: 5000
            });
            if (Array.isArray(result) && result.length === 1 && result[0] === "fail") {
                throw new RobotFirmwareError("Split segment is too small!");
            }
        } finally {
            this.robot.pollMap();
        }
    }
}

module.exports = ViomiMapSegmentEditCapability;
