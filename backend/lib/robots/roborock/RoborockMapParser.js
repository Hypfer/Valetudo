const Logger = require("../../Logger");
const mapEntities = require("../../entities/map");
const zlib = require("zlib");

/**
 * @typedef {object} Block
 * @property {number} type
 * @property {number} header_length
 * @property {number} data_length
 * @property {Buffer=} view
 */

const BlockTypes = {
    "CHARGER_LOCATION": 1,
    "IMAGE": 2,
    "PATH": 3,
    "GOTO_PATH": 4,
    "GOTO_PREDICTED_PATH": 5,
    "CURRENTLY_CLEANED_ZONES": 6,
    "GOTO_TARGET": 7,
    "ROBOT_POSITION": 8,
    "NO_GO_AREAS": 9,
    "VIRTUAL_WALLS": 10,
    "CURRENTLY_CLEANED_SEGMENTS": 11,
    "NO_MOP_AREAS": 12,
    "OBSTACLES": 15,
    "NO_VAC_AREAS": 23, // The opposite of a no mop area? Why would you need that?
    "SEGMENT_MATERIALS": 24,
    "ENEMIES": 27, // Locations of other vacuum robots detected by the AI camera (yes, really.)
    "DOOR_SILL_NO_GO_AREAS": 28, // ??
    "STUCK_POINTS": 29, // Seems to mark a spot where the robot gets stuck repeatedly as a hint to the user to create a no-go area
    "CLIFF_NO_GO_AREAS": 30, // ???
    "SMART_DOOR_SILL_NO_GO_AREAS": 31, // ????
    "SEGMENT_MATERIAL_DIRECTIONS": 32,
    "DIGEST": 1024
};

class RoborockMapParser {
    /**
     * @param {Buffer} data raw data uploaded to fds endpoint
     * @return {Promise<Buffer>} map in RRMap Format
     */
    static PREPROCESS(data) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, result) => {
                return err ? reject(err) : resolve(result);
            });
        });
    }

    /**
     * @param {Buffer} mapBuf Should contain map in RRMap Format
     * @returns {null|import("../../entities/map/ValetudoMap")}
     */
    static PARSE(mapBuf){
        if (mapBuf[0] === 0x72 && mapBuf[1] === 0x72) {// rr
            const metaData = RoborockMapParser.PARSE_METADATA(mapBuf);
            const blocks = RoborockMapParser.BUILD_BLOCK_INDEX(mapBuf.subarray(20));
            const processedBlocks = RoborockMapParser.PROCESS_BLOCKS(blocks);

            return RoborockMapParser.POST_PROCESS_BLOCKS(metaData, processedBlocks);
        } else {
            return null;
        }
    }

    /**
     * @param {Buffer} buf
     */
    static PARSE_METADATA(buf) {
        return {
            header_length: buf.readUInt16LE(2),
            data_length: buf.readUInt32LE(4),
            version: {
                major: buf.readUInt16LE(8),
                minor: buf.readUInt16LE(10)
            },
            map_index: buf.readUInt16LE(12),
            map_sequence: buf.readUInt16LE(16)
        };
    }

    /**
     * @param {Buffer} buf
     */
    static BUILD_BLOCK_INDEX(buf) {
        const block_index = [];

        while (buf.length > 0) {
            const blockMetadata = RoborockMapParser.PARSE_BLOCK_METADATA(buf);

            block_index.push(blockMetadata);
            buf = buf.subarray(blockMetadata.header_length + blockMetadata.data_length);
        }

        return block_index;
    }

    /**
     * @param {Buffer} buf
     */
    static PARSE_BLOCK_METADATA(buf) {
        const block_metadata = {
            type: buf.readUInt16LE(0),
            header_length: buf.readUInt16LE(2),
            data_length: buf.readUInt32LE(4)
        };

        block_metadata.view = buf.subarray(0, block_metadata.header_length + block_metadata.data_length);

        return block_metadata;
    }

    /**
     * @param {Block[]} blocks
     */
    static PROCESS_BLOCKS(blocks) {
        const result = {};

        blocks.forEach(block => {
            result[block.type] = RoborockMapParser.PARSE_BLOCK(block);
        });

        return result;
    }


    /**
     * @param {Block} block
     */
    static PARSE_BLOCK(block) {
        switch (block.type) {
            case BlockTypes.ROBOT_POSITION:
            case BlockTypes.CHARGER_LOCATION:
                return RoborockMapParser.PARSE_POSITION_BLOCK(block);
            case BlockTypes.IMAGE:
                return RoborockMapParser.PARSE_IMAGE_BLOCK(block);
            case BlockTypes.PATH:
            case BlockTypes.GOTO_PATH:
            case BlockTypes.GOTO_PREDICTED_PATH:
                return this.PARSE_PATH_BLOCK(block);
            case BlockTypes.GOTO_TARGET:
                return this.PARSE_GOTO_TARGET_BLOCK(block);
            case BlockTypes.CURRENTLY_CLEANED_ZONES:
            case BlockTypes.VIRTUAL_WALLS:
                return this.PARSE_STRUCTURES_BLOCK(block, false);
            case BlockTypes.NO_GO_AREAS:
                return this.PARSE_STRUCTURES_BLOCK(block, true);
            case BlockTypes.NO_MOP_AREAS:
                return this.PARSE_STRUCTURES_BLOCK(block, true);
            case BlockTypes.CURRENTLY_CLEANED_SEGMENTS:
                return this.PARSE_SEGMENTS_BLOCK(block);
            case BlockTypes.OBSTACLES:
                return this.PARSE_OBSTACLES_BLOCK(block);
            case BlockTypes.SEGMENT_MATERIALS:
                return this.PARSE_SEGMENT_MATERIALS_BLOCK(block);
            case BlockTypes.SEGMENT_MATERIAL_DIRECTIONS:
                return this.PARSE_SEGMENT_MATERIAL_DIRECTIONS_BLOCK(block);
        }
    }

    /**
     * @param {Block} block
     */
    static PARSE_POSITION_BLOCK(block) {
        return {
            position: [
                block.view.readUInt16LE(block.header_length),
                block.view.readUInt16LE(block.header_length + 4)
            ],
            //If available, the angle needs to be flipped as well
            angle: block.data_length >= 12 ? block.view.readInt32LE(block.header_length + 8) * -1 : null // gen3+
        };
    }

    /**
     * @param {Block} block
     */
    static PARSE_PATH_BLOCK(block) {
        const points = [];

        for (let i = 0; i < block.data_length; i = i + 4) {
            //to draw these coordinates onto the map pixels, they have to be divided by 50
            points.push(
                block.view.readUInt16LE(block.header_length + i),
                block.view.readUInt16LE(block.header_length + i + 2)
            );
        }

        return {
            points: points,
            current_angle: block.view.readUInt32LE(16), //This is always 0. Roborock didn't bother
        };
    }

    /**
     * @param {Block} block
     */
    static PARSE_IMAGE_BLOCK(block) {
        const parsedBlock = {
            segments: {}
        };
        let view;
        let mayContainSegments = false;

        switch (block.header_length) {
            case 24:
                view = block.view;
                break;
            case 28:
                //Gen3 headers have additional segments header data, which increases its length by 4 bytes
                //Everything else stays at the same relative offsets so we can just throw those additional bytes away
                view = block.view.subarray(4);
                mayContainSegments = true;

                //Initializing all possible 31 segments here and throwing away the empty ones later improves performance
                for (let i = 1; i < 32; i++) {
                    parsedBlock.segments[i] = [];
                }
                break;

            default:
                throw new Error("Unsupported header length. Please file a bug report");
        }

        parsedBlock.position = {
            top: view.readInt32LE(8),
            left: view.readInt32LE(12)
        };
        parsedBlock.dimensions = {
            height: view.readInt32LE(16),
            width: view.readInt32LE(20)
        };

        // position.left has to be position right for supporting the flipped map
        parsedBlock.position.top = RoborockMapParser.DIMENSION_PIXELS - parsedBlock.position.top - parsedBlock.dimensions.height;

        //There can only be pixels if there is an image
        if (parsedBlock.dimensions.height > 0 && parsedBlock.dimensions.width > 0) {
            const imageData = {
                floor: [],
                obstacle_weak: [],
                obstacle_strong: []
            };

            for (let i = 0; i < block.data_length; i++) {
                const val = view[24 + i];

                if (val !== 0) {
                    //Since we only have positive numeric values here, we can use ~~ instead of Math.floor,
                    //which is slightly faster since it basically just casts to int
                    const coordsX = (i % parsedBlock.dimensions.width) + parsedBlock.position.left;
                    const coordsY = (parsedBlock.dimensions.height-1 - ~~(i / parsedBlock.dimensions.width)) + parsedBlock.position.top;

                    const type = val & 0b00000111;
                    switch (type) {
                        case 0:
                            break;
                        case 1:
                            imageData.obstacle_strong.push([coordsX, coordsY]);
                            break;
                        default: {
                            if (mayContainSegments) {
                                const segmentId = (val & 0b11111000) >> 3;

                                if (segmentId !== 0) {
                                    parsedBlock.segments[segmentId].push([coordsX, coordsY]);
                                    break;
                                }
                            }
                            imageData.floor.push([coordsX, coordsY]);
                            break;
                        }
                    }
                }
            }

            parsedBlock.pixels = imageData;
        }

        //Clean up all segments that aren't present in this map (have 0 pixels)
        if (mayContainSegments) {
            Object.keys(parsedBlock.segments).forEach(k => {
                if (!(parsedBlock.segments[k]?.length > 0)) {
                    delete(parsedBlock.segments[k]);
                }
            });
        }

        return parsedBlock;
    }

    /**
     * @param {Block} block
     */
    static PARSE_GOTO_TARGET_BLOCK(block) {
        return {
            position: [
                block.view.readUInt16LE(block.header_length),
                block.view.readUInt16LE(block.header_length + 2)
            ]
        };
    }

    /**
     * @param {Block} block
     * @param {boolean} extended
     */
    static PARSE_STRUCTURES_BLOCK(block, extended) {
        const structureCount = block.view.readUInt32LE(8);
        const structures = [];

        if (structureCount > 0) {
            for (let i = 0; i < block.data_length; i = i + (extended === true ? 16 : 8)) {
                const structure = [
                    block.view.readUInt16LE(block.header_length + i),
                    block.view.readUInt16LE(block.header_length + i + 2),
                    block.view.readUInt16LE(block.header_length + i + 4),
                    block.view.readUInt16LE(block.header_length + i + 6)
                ];

                if (extended === true) {
                    structure.push(
                        block.view.readUInt16LE(block.header_length + i + 8),
                        block.view.readUInt16LE(block.header_length + i + 10),
                        block.view.readUInt16LE(block.header_length + i + 12),
                        block.view.readUInt16LE(block.header_length + i + 14)
                    );
                }

                structures.push(structure);
            }

            return structures;
        } else {
            return undefined;
        }
    }

    /**
     * @param {Block} block
     */
    static PARSE_SEGMENTS_BLOCK(block) {
        const segmentsCount = block.view.readUInt32LE(8);
        const segments = [];

        if (segmentsCount > 0) {
            for (let i = 0; i < block.data_length; i++) {
                segments.push(block.view.readUInt8(block.header_length + i).toString());
            }

            return segments;
        } else {
            return undefined;
        }
    }

    /**
     * @param {Block} block
     */
    static PARSE_OBSTACLES_BLOCK(block) {
        const obstacleCount = block.view.readUInt32LE(8);
        const obstacles = [];

        if (obstacleCount > 0) {
            const obstacleSize = block.data_length/obstacleCount;

            for (let i = 0; i < block.data_length; i = i + obstacleSize) {
                const obstacle = {
                    position: [
                        block.view.readUInt16LE(block.header_length + i),
                        block.view.readUInt16LE(block.header_length + i + 2)
                    ],
                    type: block.view.readUInt16LE(block.header_length + i + 4),
                    confidence: block.view.readUInt16LE(block.header_length + i + 6)
                };

                obstacles.push({
                    position: obstacle.position,
                    type: OBSTACLE_TYPES[obstacle.type] ?? `Unknown ID ${obstacle.type}`,
                    confidence: `${Math.round(obstacle.confidence/100)}%`
                });
            }

            return obstacles;
        } else {
            return undefined;
        }
    }

    /**
     * @param {Block} block
     */
    static PARSE_SEGMENT_MATERIALS_BLOCK(block) {
        const segmentMaterials = {};

        for (let i = 0; i < block.data_length; i++) {
            const materialId = block.view.readUInt8(block.header_length + i);

            let material;
            switch (materialId) {
                case 0:
                    material = mapEntities.MapLayer.MATERIAL.GENERIC;
                    break;
                case 3:
                    material = mapEntities.MapLayer.MATERIAL.WOOD;
                    break;
                case 4:
                    material = mapEntities.MapLayer.MATERIAL.TILE;
                    break;
                default:
                    Logger.warn("Unhandled segment material", materialId);
            }

            segmentMaterials[i] = material;
        }

        return segmentMaterials;
    }

    /**
     * @param {Block} block
     */
    static PARSE_SEGMENT_MATERIAL_DIRECTIONS_BLOCK(block) {
        const segmentMaterialDirections = {};

        for (let i = 0; i < block.data_length; i = i + 3) {
            const segmentId = block.view.readUInt8(block.header_length + i);

            segmentMaterialDirections[segmentId] = block.view.readUInt16LE(block.header_length + i + 1);
        }

        return segmentMaterialDirections;
    }

    /**
     *
     * @param {object} metaData
     * @param {object} blocks
     * @returns {null|import("../../entities/map/ValetudoMap")}
     */
    static POST_PROCESS_BLOCKS(metaData, blocks) {
        if (blocks[BlockTypes.IMAGE] && blocks[BlockTypes.IMAGE].pixels) { //We need the image to flip everything else correctly
            const layers = [];
            const entities = [];
            let angle = null;

            if (blocks[BlockTypes.IMAGE].pixels.floor.length > 0) {
                layers.push(
                    new mapEntities.MapLayer({
                        pixels: blocks[BlockTypes.IMAGE].pixels.floor.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                        type: mapEntities.MapLayer.TYPE.FLOOR,
                    })
                );
            }

            if (blocks[BlockTypes.IMAGE].pixels.obstacle_strong.length > 0) {
                layers.push(
                    new mapEntities.MapLayer({
                        pixels: blocks[BlockTypes.IMAGE].pixels.obstacle_strong.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                        type: mapEntities.MapLayer.TYPE.WALL,
                    })
                );
            }

            Object.keys(blocks[BlockTypes.IMAGE].segments).forEach(segmentId => {
                if (blocks[BlockTypes.IMAGE].segments[segmentId].length === 0) {
                    return;
                }

                const metaData = {
                    segmentId: segmentId,
                    active: false
                };

                if (blocks[BlockTypes.CURRENTLY_CLEANED_SEGMENTS]) {
                    metaData.active = blocks[BlockTypes.CURRENTLY_CLEANED_SEGMENTS].includes(segmentId);
                }
                if (blocks[BlockTypes.SEGMENT_MATERIALS]) {
                    let material = blocks[BlockTypes.SEGMENT_MATERIALS][segmentId];

                    if (
                        material === mapEntities.MapLayer.MATERIAL.WOOD &&
                        blocks[BlockTypes.SEGMENT_MATERIAL_DIRECTIONS]?.[segmentId] !== undefined
                    ) {
                        const direction = blocks[BlockTypes.SEGMENT_MATERIAL_DIRECTIONS][segmentId];

                        if (direction === 0) {
                            material = mapEntities.MapLayer.MATERIAL.WOOD_HORIZONTAL;
                        } else if (direction === 90) {
                            material = mapEntities.MapLayer.MATERIAL.WOOD_VERTICAL;
                        }
                    }

                    metaData.material = material;
                }

                layers.push(new mapEntities.MapLayer({
                    pixels: blocks[BlockTypes.IMAGE].segments[segmentId].sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.SEGMENT,
                    metaData: metaData
                }));
            });

            if (blocks[BlockTypes.PATH]) {
                const points = TransformRoborockCoordinateArraysToValetudoCoordinateArrays(blocks[BlockTypes.PATH].points);

                //Fallback angle calculation from path if it's not part of the position block
                if (
                    blocks[BlockTypes.ROBOT_POSITION] &&
                    (blocks[BlockTypes.ROBOT_POSITION].angle === null || blocks[BlockTypes.ROBOT_POSITION] === undefined)
                ) {
                    if (blocks[BlockTypes.PATH].points.length >= 4) {
                        angle = Math.round(Math.atan2(
                            points[points.length - 1] -
                            points[points.length - 3],

                            points[points.length - 2] -
                            points[points.length - 4]

                        ) * 180 / Math.PI);
                    }
                }

                if (points?.length > 0) {
                    entities.push(new mapEntities.PathMapEntity({
                        points: points,
                        type: mapEntities.PathMapEntity.TYPE.PATH
                    }));
                }
            }

            if (blocks[BlockTypes.GOTO_PREDICTED_PATH]) {
                const predictedPathPoints = TransformRoborockCoordinateArraysToValetudoCoordinateArrays(blocks[BlockTypes.GOTO_PREDICTED_PATH].points);

                if (predictedPathPoints?.length > 0) {
                    entities.push(new mapEntities.PathMapEntity({
                        points: predictedPathPoints,
                        type: mapEntities.PathMapEntity.TYPE.PREDICTED_PATH
                    }));
                }
            }

            if (blocks[BlockTypes.CHARGER_LOCATION]) {
                entities.push(new mapEntities.PointMapEntity({
                    points: TransformRoborockCoordinateArraysToValetudoCoordinateArrays(blocks[BlockTypes.CHARGER_LOCATION].position),
                    type: mapEntities.PointMapEntity.TYPE.CHARGER_LOCATION
                }));
            }

            if (blocks[BlockTypes.ROBOT_POSITION]) {
                if (blocks[BlockTypes.ROBOT_POSITION].angle !== null) {
                    angle = blocks[BlockTypes.ROBOT_POSITION].angle;
                }

                angle = angle !== null ? angle : 0; //fallback

                //Roborock uses -180 to +180 with 0 being the robot facing east
                //We're using 0-360 with 0 being the robot facing north
                angle = (angle + 450) % 360;

                entities.push(new mapEntities.PointMapEntity({
                    points: TransformRoborockCoordinateArraysToValetudoCoordinateArrays(blocks[BlockTypes.ROBOT_POSITION].position),
                    metaData: {
                        angle: angle
                    },
                    type: mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
                }));
            }

            if (blocks[BlockTypes.GOTO_TARGET]) {
                entities.push(new mapEntities.PointMapEntity({
                    points:TransformRoborockCoordinateArraysToValetudoCoordinateArrays(blocks[BlockTypes.GOTO_TARGET].position),
                    type: mapEntities.PointMapEntity.TYPE.GO_TO_TARGET
                }));
            }

            if (blocks[BlockTypes.CURRENTLY_CLEANED_ZONES]) {
                blocks[BlockTypes.CURRENTLY_CLEANED_ZONES].forEach(zone => {
                    zone = TransformRoborockCoordinateArraysToValetudoCoordinateArrays(zone);

                    //Roborock specifies zones with only two coordinates so we need to add the missing ones
                    entities.push(new mapEntities.PolygonMapEntity({
                        type: mapEntities.PolygonMapEntity.TYPE.ACTIVE_ZONE,
                        points: [
                            zone[0],
                            zone[1],
                            zone[0],
                            zone[3],
                            zone[2],
                            zone[3],
                            zone[2],
                            zone[1]
                        ]
                    }));
                });
            }

            if (blocks[BlockTypes.NO_GO_AREAS]) {
                blocks[BlockTypes.NO_GO_AREAS].forEach(area => {
                    entities.push(new mapEntities.PolygonMapEntity({
                        points: TransformRoborockCoordinateArraysToValetudoCoordinateArrays(area),
                        type: mapEntities.PolygonMapEntity.TYPE.NO_GO_AREA
                    }));
                });
            }

            if (blocks[BlockTypes.NO_MOP_AREAS]) {
                blocks[BlockTypes.NO_MOP_AREAS].forEach(area => {
                    entities.push(new mapEntities.PolygonMapEntity({
                        points: TransformRoborockCoordinateArraysToValetudoCoordinateArrays(area),
                        type: mapEntities.PolygonMapEntity.TYPE.NO_MOP_AREA
                    }));
                });
            }

            if (blocks[BlockTypes.VIRTUAL_WALLS]) {
                blocks[BlockTypes.VIRTUAL_WALLS].forEach(wall => {
                    entities.push(new mapEntities.LineMapEntity({
                        points: TransformRoborockCoordinateArraysToValetudoCoordinateArrays(wall),
                        type: mapEntities.LineMapEntity.TYPE.VIRTUAL_WALL
                    }));
                });
            }

            if (blocks[BlockTypes.OBSTACLES]) {
                blocks[BlockTypes.OBSTACLES].forEach(obstacle => {
                    entities.push(new mapEntities.PointMapEntity({
                        points: TransformRoborockCoordinateArraysToValetudoCoordinateArrays(obstacle.position),
                        type: mapEntities.PointMapEntity.TYPE.OBSTACLE,
                        metaData: {
                            label: `${obstacle.type} (${obstacle.confidence})`
                        }
                    }));
                });

            }

            return new mapEntities.ValetudoMap({
                metaData: {
                    vendorMapId: metaData.map_index
                },
                size: {
                    x: 5120,
                    y: 5120
                },
                pixelSize: 5,
                layers: layers,
                entities: entities
            });
        } else {
            return null;
        }
    }
}

function TransformRoborockCoordinateArraysToValetudoCoordinateArrays(points) {
    return points.map((p, i) => {
        if (i % 2 === 0) {
            return Math.round(p/10);
        } else {
            return Math.round((RoborockMapParser.DIMENSION_MM - p)/10);
        }
    });
}

const OBSTACLE_TYPES = {
    "0": "Cable",
    "1": "Feces",
    "2": "Shoe",
    "3": "Pedestal",
    "4": "Pedestal",
    "5": "Power Strip",
    "9": "Bathroom Scale",
    "10": "Fabric",
    "18": "Obstacle",
    "25": "Dustpan",
    "26": "Furniture",
    "27": "Furniture",
    "34": "Fabric",
    "42": "Obstacle",
    "48": "Cable",
    "49": "Cat",
    "50": "Dog",
    "51": "Fabric"
};


RoborockMapParser.DIMENSION_PIXELS = 1024;
RoborockMapParser.DIMENSION_MM = 50 * 1024;

module.exports = RoborockMapParser;
