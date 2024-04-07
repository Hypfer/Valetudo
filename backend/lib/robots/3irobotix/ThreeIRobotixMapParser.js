const mapEntities = require("../../entities/map");
const zlib = require("zlib");

/**
 * @typedef {object} Block
 * @property {number} type
 * @property {Buffer} view
 */


class ThreeIRobotixMapParser {
    /**
     * @param {Buffer} mapBuf Should contain map data
     * @returns {null|import("../../entities/map/ValetudoMap")}
     */
    static PARSE(mapBuf){
        if (mapBuf.length < 4) {
            return null;
        }
        const flagData = ThreeIRobotixMapParser.PARSE_FLAGS(mapBuf);
        const uniqueMapIdBytes = mapBuf.subarray(4,8);
        const uniqueMapId = uniqueMapIdBytes.readUInt32LE();

        if (flagData[TYPE_FLAGS.MAP_IMAGE] !== true || flagData[TYPE_FLAGS.ROBOT_STATUS] !== true) {
            return null;
        }

        let blocks;

        if (uniqueMapId > 0) {
            blocks = ThreeIRobotixMapParser.BUILD_BLOCK_INDEX(mapBuf, uniqueMapIdBytes, flagData);
        } else {
            blocks = ThreeIRobotixMapParser.BUILD_FALLBACK_INDEX(mapBuf, flagData);
        }

        const processedBlocks = ThreeIRobotixMapParser.PROCESS_BLOCKS(blocks, uniqueMapId === 0);


        return ThreeIRobotixMapParser.POST_PROCESS_BLOCKS(processedBlocks, uniqueMapId);
    }

    /**
     * This is used for temporary maps (e.g., on initial cleanup when there are no segments yet)
     *
     * @param {Buffer} mapBuf
     * @param {object} flagData
     * @return {Array<Block>}
     */
    static BUILD_FALLBACK_INDEX(mapBuf, flagData) {
        const types = Object.entries(flagData).filter(([key, value]) => {
            return value === true;
        }).map(([key, value]) => {
            return parseInt(key);
        });
        const foundChunks = [];
        let offset = 0;

        types.forEach((type) => {
            switch (type) {
                case TYPE_FLAGS.ROBOT_STATUS:
                    foundChunks.push({
                        type: TYPE_FLAGS.ROBOT_STATUS,
                        view: mapBuf.subarray(offset, offset + 48)
                    });

                    offset += 48;
                    break;
                case TYPE_FLAGS.MAP_IMAGE: {
                    const header = ThreeIRobotixMapParser.PARSE_IMAGE_BLOCK_HEADER(mapBuf.subarray(offset));

                    if (
                        Number.isInteger(header.height) && Number.isInteger(header.width) &&
                        header.height > 0 && header.width > 0
                    ) {
                        foundChunks.push({
                            type: TYPE_FLAGS.MAP_IMAGE,
                            view: mapBuf.subarray(offset, offset + header.blockLength)
                        });
                    }

                    offset += header.blockLength;

                    break;
                }
                case TYPE_FLAGS.PATH: {
                    const header = ThreeIRobotixMapParser.PARSE_PATH_BLOCK_HEADER(mapBuf.subarray(offset));

                    foundChunks.push({
                        type: TYPE_FLAGS.PATH,
                        view: mapBuf.subarray(offset, offset + header.blockLength)
                    });

                    offset += header.blockLength;

                    break;
                }
            }
        });

        return foundChunks;
    }

    /**
     * Because each block conveniently starts with the uniqueMapId, we can use that
     * to slice our map file into blocks that can then be processed further
     * 
     * @param {Buffer} mapBuf
     * @param {Buffer} uniqueMapIdBytes
     * @param {object} flagData
     * @return {Array<Block>}
     */
    static BUILD_BLOCK_INDEX(mapBuf, uniqueMapIdBytes, flagData) {
        const types = Object.entries(flagData).filter(([key, value]) => {
            return value === true;
        }).map(([key, value]) => {
            return parseInt(key);
        });
        const foundChunks = [];
        const foundChunksArr = [];
        let offset = 0;
        let foundIndex;

        do {
            foundIndex = mapBuf.indexOf(uniqueMapIdBytes, offset);

            if (foundIndex !== -1) {
                const type = types[foundChunksArr.length];

                foundChunksArr.push({
                    type: type,
                    startIdx: foundIndex
                });
                offset = foundIndex + 4;
            }
        } while (foundIndex !== -1);

        foundChunksArr.forEach((elem, idx) => {
            foundChunks.push({
                type: elem.type,
                view: mapBuf.subarray(elem.startIdx, foundChunksArr[idx+1]?.startIdx)
            });
        });

        return foundChunks;
    }

    /**
     * @param {Buffer} buf
     */
    static PARSE_FLAGS(buf) {
        const flagBytes = buf.readUint16LE(0);

        const mapFlags = {};

        Object.values(TYPE_FLAGS).forEach(flag => {
            mapFlags[flag] = (flagBytes & flag) !== 0;
        });

        return mapFlags;
    }

    /**
     * @param {Block[]} blocks
     * @param {boolean} isTemporaryMap
     */
    static PROCESS_BLOCKS(blocks, isTemporaryMap) {
        const result = {};

        blocks.forEach(block => {
            result[block.type] = ThreeIRobotixMapParser.PARSE_BLOCK(block, isTemporaryMap);
        });

        return result;
    }

    /**
     * @param {Block} block
     * @param {boolean} isTemporaryMap
     */
    static PARSE_BLOCK(block, isTemporaryMap) {
        switch (block.type) {
            case TYPE_FLAGS.MAP_IMAGE:
                return ThreeIRobotixMapParser.PARSE_IMAGE_BLOCK(block, isTemporaryMap);
            case TYPE_FLAGS.SEGMENT_NAMES:
                return ThreeIRobotixMapParser.PARSE_SEGMENT_NAMES_BLOCK(block);
            case TYPE_FLAGS.PATH:
                return ThreeIRobotixMapParser.PARSE_PATH_BLOCK(block);
            case TYPE_FLAGS.ROBOT_POSITION:
                return ThreeIRobotixMapParser.PARSE_ROBOT_POSITION_BLOCK(block);
            case TYPE_FLAGS.CHARGER_LOCATION:
                return ThreeIRobotixMapParser.PARSE_CHARGER_LOCATION_BLOCK(block);
            case TYPE_FLAGS.VIRTUAL_RESTRICTIONS:
                return ThreeIRobotixMapParser.PARSE_STRUCTURES_BLOCK(block, true);
            case TYPE_FLAGS.ACTIVE_ZONES:
                return ThreeIRobotixMapParser.PARSE_STRUCTURES_BLOCK(block, false);
            default:
                return null;
        }
    }

    static PARSE_IMAGE_BLOCK_HEADER(buf) {
        const headerData = {
            mapId: buf.readUInt32LE(4),
            valid: buf.readUInt32LE(8),

            width: buf.readUInt32LE(12),
            height: buf.readUInt32LE(16),

            minX: buf.readFloatLE(20),
            minY: buf.readFloatLE(24),
            maxX: buf.readFloatLE(28),
            maxY: buf.readFloatLE(32),
            resolution: buf.readFloatLE(36),
        };

        headerData.blockLength = 40 + headerData.height * headerData.width;

        return headerData;
    }

    /**
     * @param {Block} block
     * @param {boolean} isTemporaryMap
     */
    static PARSE_IMAGE_BLOCK(block, isTemporaryMap) {
        const header = ThreeIRobotixMapParser.PARSE_IMAGE_BLOCK_HEADER(block.view);

        if (header.height * header.width !== block.view.length - 40) {
            throw new Error("Image block does not contain the correct amount of pixels or invalid image header.");
        }

        const pixelData = block.view.subarray(40);
        const pixels = {
            floor: [],
            wall: [],
            segments: {}
        };
        const activeSegments = {};

        for (let i = 0; i < header.height; i++) {
            for (let j = 0; j < header.width; j++) {
                const val = pixelData[(i * header.width) + j];
                const coords = [
                    j,
                    header.height - i - 1 //FIXME: For reasons I don't understand, the map looks more correct with -1?
                ];

                switch (val) {
                    case 0:
                        // non-floor, do nothing
                        break;
                    case 255:
                        pixels.wall.push([coords[0], coords[1]]);
                        break;
                    case 1: // non-room
                        pixels.floor.push([coords[0], coords[1]]);
                        break;
                    default: {
                        if (!isTemporaryMap) {
                            const isActive = val >= 60;
                            let segmentId = val;

                            if (isActive) {
                                segmentId = segmentId - 50; //TODO: this can't be right but it works?
                                activeSegments[segmentId] = true;
                            }

                            if (!Array.isArray(pixels.segments[segmentId])) {
                                pixels.segments[segmentId] = [];
                            }

                            pixels.segments[segmentId].push([coords[0], coords[1]]);
                        } else {
                            pixels.floor.push([coords[0], coords[1]]);
                        }
                    }
                }
            }
        }


        return {
            mapId: header.mapId,
            position: {
                top: 0,
                left: 0,
            },
            dimensions: {
                height: header.height,
                width: header.width,
            },
            pixelSize: Math.round(header.resolution * FLOAT_TO_PIXEL_FACTOR),
            activeSegments: activeSegments,
            pixels: pixels,
        };
    }

    /**
     * @param {Block} block
     */
    static PARSE_SEGMENT_NAMES_BLOCK(block) {
        const segments = {};
        let offset = 4;


        const mapNameLength = block.view[offset];
        offset += mapNameLength + 1;
        // For now, we'll just ignore that map name
        offset += 4;

        const segmentCount = block.view.readUInt32LE(offset);
        offset += 4;

        if (segmentCount > 0xff) {
            // This seems to be a map file that contains more than one map name. Aborting for now
            return segments;
        }

        for (let i = 0; i < segmentCount; i++) {
            const segmentId = block.view[offset];
            const nameLength = block.view[offset +1];
            offset += 1 + 1;

            const name = block.view.subarray(offset, offset + nameLength).toString("utf-8");
            offset += nameLength + 1; // there's a single byte after the room name with an unknown purpose

            offset += 8; //here, we're skipping some coordinates for the room label it seems?

            segments[segmentId] = name;
        }


        return segments;
    }

    static PARSE_PATH_BLOCK_HEADER(buf) {
        const headerData = {
            // At offset 4 there's a poseId. No idea what that does
            pathLength: buf.readUInt32LE(8)
        };

        headerData.blockLength = 12 + (headerData.pathLength * 9);

        return headerData;
    }

    /**
     * @param {Block} block
     */
    static PARSE_PATH_BLOCK(block) {
        const points = [];
        const header = ThreeIRobotixMapParser.PARSE_PATH_BLOCK_HEADER(block.view);
        let offset = 12;

        for (let i = 0; i < header.pathLength; i++) {
            // The first byte is the mode. 0: taxiing, 1: cleaning
            points.push(
                block.view.readFloatLE(offset + 1),
                block.view.readFloatLE(offset + 5)
            );

            offset += 9;
        }

        return points;
    }

    /**
     * @param {Block} block
     */
    static PARSE_ROBOT_POSITION_BLOCK(block) {
        // At offset 4 there's some ID and after that there's what seems to be some kind of flag byte?
        const x = block.view.readFloatLE(9);
        const y = block.view.readFloatLE(13);
        const angle = block.view.readFloatLE(17);

        return {
            x: x,
            y: y,
            angle: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_ANGLE(angle)
        };
    }

    /**
     * @param {Block} block
     */
    static PARSE_CHARGER_LOCATION_BLOCK(block) {
        const x = block.view.readFloatLE(4);
        const y = block.view.readFloatLE(8);
        const angle = block.view.readFloatLE(12);

        return {
            x: x,
            y: y,
            angle: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_ANGLE(angle)
        };
    }

    /**
     * @param {Block} block
     * @param {boolean} canHaveWalls
     */
    static PARSE_STRUCTURES_BLOCK(block, canHaveWalls = false) {
        const areaData = {
            walls: [],
            areas: []
        };

        // There is some unknown 4-byte value at offset 4
        const restrictionCount = block.view.readUInt32LE(8);
        let offset = 12;


        for (let i = 0; i < restrictionCount; i++) {
            offset += 12; // some kind of header

            const x0 = block.view.readFloatLE(offset);
            const y0 = block.view.readFloatLE(offset + 4);
            const x1 = block.view.readFloatLE(offset + 8);
            const y1 = block.view.readFloatLE(offset + 12);
            const x2 = block.view.readFloatLE(offset + 16);
            const y2 = block.view.readFloatLE(offset + 20);
            const x3 = block.view.readFloatLE(offset + 24);
            const y3 = block.view.readFloatLE(offset + 28);

            if (canHaveWalls && x0 === x1 && y0 === y1 && x2 === x3 && y2 === y3) {
                areaData.walls.push([
                    x0, y0,
                    x2, y2
                ]);
            } else {
                areaData.areas.push([
                    x0, y0,
                    x1, y1,
                    x2, y2,
                    x3, y3,
                ]);
            }

            offset += 32;
            offset += 48; // unknown data
        }

        return areaData;
    }

    /**
     *
     * @param {object} blocks
     * @param {number} uniqueMapId
     * @returns {null|import("../../entities/map/ValetudoMap")}
     */
    static POST_PROCESS_BLOCKS(blocks, uniqueMapId) {
        if (blocks[TYPE_FLAGS.MAP_IMAGE]?.pixels) {
            const mapWidth = blocks[TYPE_FLAGS.MAP_IMAGE].dimensions.width;
            const mapHeight = blocks[TYPE_FLAGS.MAP_IMAGE].dimensions.height;
            const pixelSize = blocks[TYPE_FLAGS.MAP_IMAGE].pixelSize;

            const layers = [];
            const entities = [];

            let pathPoints = [];
            let calculatedRobotAngle;

            if (blocks[TYPE_FLAGS.MAP_IMAGE].pixels.floor.length > 0) {
                layers.push(new mapEntities.MapLayer({
                    pixels: blocks[TYPE_FLAGS.MAP_IMAGE].pixels.floor.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.FLOOR
                }));
            }

            if (blocks[TYPE_FLAGS.MAP_IMAGE].pixels.wall.length > 0) {
                layers.push(new mapEntities.MapLayer({
                    pixels: blocks[TYPE_FLAGS.MAP_IMAGE].pixels.wall.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.WALL
                }));
            }

            Object.keys(blocks[TYPE_FLAGS.MAP_IMAGE].pixels.segments).forEach((segmentId) => {
                const name = blocks[TYPE_FLAGS.SEGMENT_NAMES]?.[segmentId];

                layers.push(new mapEntities.MapLayer({
                    pixels: blocks[TYPE_FLAGS.MAP_IMAGE].pixels.segments[segmentId].sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.SEGMENT,
                    metaData: {
                        segmentId: segmentId,
                        active: !!blocks[TYPE_FLAGS.MAP_IMAGE].activeSegments[segmentId],
                        name: name
                    }
                }));
            });


            if (blocks[TYPE_FLAGS.PATH]?.length > 0) {
                pathPoints = ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_COORDINATES(blocks[TYPE_FLAGS.PATH], mapWidth, mapHeight, pixelSize);

                entities.push(new mapEntities.PathMapEntity({
                    points: pathPoints,
                    type: mapEntities.PathMapEntity.TYPE.PATH
                }));

                // Calculate robot angle from path if possible - the robot-reported angle is inaccurate
                if (pathPoints.length >= 4) {
                    calculatedRobotAngle = (Math.round(Math.atan2(
                        pathPoints[pathPoints.length - 1] -
                        pathPoints[pathPoints.length - 3],

                        pathPoints[pathPoints.length - 2] -
                        pathPoints[pathPoints.length - 4]
                    ) * 180 / Math.PI) + 90) % 360; //TODO: No idea why
                }
            }

            if (blocks[TYPE_FLAGS.ROBOT_POSITION]) {
                const x = blocks[TYPE_FLAGS.ROBOT_POSITION].x;
                const y = blocks[TYPE_FLAGS.ROBOT_POSITION].y;

                entities.push(new mapEntities.PointMapEntity({
                    points: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_COORDINATES([x, y], mapWidth, mapHeight, pixelSize),
                    metaData: {
                        angle: calculatedRobotAngle ?? blocks[TYPE_FLAGS.ROBOT_POSITION].angle
                    },
                    type: mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
                }));
            } else if (uniqueMapId === 0 && pathPoints.length >= 2) {
                entities.push(new mapEntities.PointMapEntity({
                    points: [
                        pathPoints[pathPoints.length - 2],
                        pathPoints[pathPoints.length - 1]
                    ],
                    metaData: {
                        angle: calculatedRobotAngle ?? 0
                    },
                    type: mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
                }));
            }

            if (blocks[TYPE_FLAGS.CHARGER_LOCATION]) {
                const x = blocks[TYPE_FLAGS.CHARGER_LOCATION].x;
                const y = blocks[TYPE_FLAGS.CHARGER_LOCATION].y;

                entities.push(new mapEntities.PointMapEntity({
                    points: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_COORDINATES([x, y], mapWidth, mapHeight, pixelSize),
                    metaData: {
                        angle: blocks[TYPE_FLAGS.CHARGER_LOCATION].angle
                    },
                    type: mapEntities.PointMapEntity.TYPE.CHARGER_LOCATION
                }));
            }

            if (blocks[TYPE_FLAGS.VIRTUAL_RESTRICTIONS]) {
                blocks[TYPE_FLAGS.VIRTUAL_RESTRICTIONS].walls.forEach((wall) => {
                    entities.push(new mapEntities.LineMapEntity({
                        points: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_COORDINATES(wall, mapWidth, mapHeight, pixelSize),
                        type: mapEntities.LineMapEntity.TYPE.VIRTUAL_WALL
                    }));
                });

                blocks[TYPE_FLAGS.VIRTUAL_RESTRICTIONS].areas.forEach((area) => {
                    entities.push(new mapEntities.PolygonMapEntity({
                        points: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_COORDINATES(area, mapWidth, mapHeight, pixelSize),
                        type: mapEntities.PolygonMapEntity.TYPE.NO_GO_AREA
                    }));
                });
            }

            if (blocks[TYPE_FLAGS.ACTIVE_ZONES]) {
                blocks[TYPE_FLAGS.ACTIVE_ZONES].areas.forEach((activeZone) => {
                    entities.push(new mapEntities.PolygonMapEntity({
                        points: ThreeIRobotixMapParser.CONVERT_TO_VALETUDO_COORDINATES(activeZone, mapWidth, mapHeight, pixelSize),
                        type: mapEntities.PolygonMapEntity.TYPE.ACTIVE_ZONE
                    }));
                });
            }

            if (layers.length > 0) {
                return new mapEntities.ValetudoMap({
                    metaData: {
                        vendorMapId: uniqueMapId
                    },
                    size: {
                        x: blocks[TYPE_FLAGS.MAP_IMAGE].dimensions.width * blocks[TYPE_FLAGS.MAP_IMAGE].pixelSize,
                        y: blocks[TYPE_FLAGS.MAP_IMAGE].dimensions.height * blocks[TYPE_FLAGS.MAP_IMAGE].pixelSize
                    },
                    pixelSize: blocks[TYPE_FLAGS.MAP_IMAGE].pixelSize,
                    layers: layers,
                    entities: entities
                });
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * @param {Buffer|string} data
     * @returns {Promise<Buffer>}
     */
    static async PREPROCESS(data) {
        return new Promise((resolve, reject) => {
            zlib.inflate(data, (err, result) => {
                return err ? reject(err) : resolve(result);
            });
        });
    }

    /**
     *
     * @param {Array<number>} points
     * @param {number} mapWidth
     * @param {number} mapHeight
     * @param {number} pixelSize
     * @returns {Array<number>}
     */
    static CONVERT_TO_VALETUDO_COORDINATES(points, mapWidth, mapHeight, pixelSize) {
        //Technically this should be using the center of minX and maxX from the map image header, however using the mapWidth
        //does do the same thing and that is available on the map without having to store additional data in its metaData
        const horizontalCenterPixelOffset = ((mapWidth /2) * pixelSize);
        const verticalPixelHeight = (mapHeight * pixelSize);

        const converted = [];
        for (let i = 0; i < points.length; i = i + 2) {
            converted.push(
                horizontalCenterPixelOffset + Math.ceil(points[i] * FLOAT_TO_PIXEL_FACTOR),
                verticalPixelHeight - (horizontalCenterPixelOffset + Math.ceil(points[i+1] * FLOAT_TO_PIXEL_FACTOR)),
            );
        }

        return converted;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} mapWidth
     * @param {number} mapHeight
     * @param {number} pixelSize
     * @return {{x: number, y: number}}
     */
    static CONVERT_TO_THREEIROBOTIX_COORDINATES(x, y, mapWidth, mapHeight, pixelSize) {
        const horizontalCenterOffset = ((mapWidth /2) * pixelSize) / FLOAT_TO_PIXEL_FACTOR;
        const verticalPixelHeight = (mapHeight * pixelSize);

        return {
            x: x / FLOAT_TO_PIXEL_FACTOR - horizontalCenterOffset,
            y: (verticalPixelHeight - y) / FLOAT_TO_PIXEL_FACTOR - horizontalCenterOffset
        };
    }

    /**
     * 
     * @param {number} angle
     * @return {number}
     */
    static CONVERT_TO_VALETUDO_ANGLE(angle) {
        return (angle + 180) % 360;
    }
}

const FLOAT_TO_PIXEL_FACTOR = 100;

const TYPE_FLAGS = {
    ROBOT_STATUS:              0b0000000000000000000000000000001,
    MAP_IMAGE:                 0b0000000000000000000000000000010,
    PATH:                      0b0000000000000000000000000000100,
    CHARGER_LOCATION:          0b0000000000000000000000000001000,
    VIRTUAL_RESTRICTIONS:      0b0000000000000000000000000010000,
    ACTIVE_ZONES:              0b0000000000000000000000000100000,
    GO_TO_TARGET:              0b0000000000000000000000001000000,
    ROBOT_POSITION:            0b0000000000000000000000010000000,

    UNKNOWN_1:                 0b0000000000000000000000100000000,
    UNKNOWN_2:                 0b0000000000000000000001000000000,
    UNKNOWN_3:                 0b0000000000000000000010000000000,
    UNKNOWN_4:                 0b0000000000000000000100000000000,

    SEGMENT_NAMES:             0b0000000000000000001000000000000,

    TBD_CLEANING_ROOM:         0b0000000000000000010000000000000,
    TBD_ROOM_CHAIN:            0b0000000000000000100000000000000,
    TBD_PATROL_LOCATION:       0b0000000000000001000000000000000,
    TBD_CLEAN_PATH_COLLECTION: 0b0000000000000010000000000000000,
    TBD_MAP_INFO:              0b0000000000000100000000000000000,
    TBD_IRREGULAR_ZONE:        0b0000000000001000000000000000000,
    TBD_AI_VER_INFO:           0b0000000000010000000000000000000,
    TBD_AI_INFO:               0b0000000000100000000000000000000,
    TBD_HOUSE_INFO:            0b0000000001000000000000000000000,
    TBD_MATERIAL_INFO:         0b0000000010000000000000000000000,
    TBD_SPEC_MATERIAL_INFO:    0b0000000100000000000000000000000,
    TBD_LOC_COLLECTION:        0b0000001000000000000000000000000,
    TBD_MODEL_INFO:            0b0000010000000000000000000000000,
};

module.exports = ThreeIRobotixMapParser;
