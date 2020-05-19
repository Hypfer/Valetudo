const Tools = require("./Tools");

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
    "DIGEST": 1024
};

class RRMapParser {
    /**
     * @param {Buffer} mapBuf Should contain map in RRMap Format
     * @returns {null|object}
     */
    static PARSE(mapBuf){
        if (mapBuf[0x00] === 0x72 && mapBuf[0x01] === 0x72) {// rr
            const metaData = RRMapParser.PARSE_METADATA(mapBuf);
            const blocks = RRMapParser.BUILD_BLOCK_INDEX(mapBuf.slice(0x14));
            const processedBlocks = RRMapParser.PROCESS_BLOCKS(blocks);

            return RRMapParser.POST_PROCESS_BLOCKS(metaData, processedBlocks);
        } else {
            return null;
        }
    }

    /**
     * @param {Buffer} buf
     */
    static PARSE_METADATA(buf) {
        return  {
            header_length: buf.readUInt16LE(0x02),
            data_length: buf.readUInt32LE(0x04),
            version: {
                major: buf.readUInt16LE(0x08),
                minor: buf.readUInt16LE(0x0A)
            },
            map_index: buf.readUInt16LE(0x0C),
            map_sequence: buf.readUInt16LE(0x10)
        };
    }

    /**
     * @param {Buffer} buf
     */
    static BUILD_BLOCK_INDEX(buf) {
        const block_index = [];

        while (buf.length > 0) {
            const blockMetadata = RRMapParser.PARSE_BLOCK_METADATA(buf);

            block_index.push(blockMetadata);
            buf = buf.slice(blockMetadata.header_length + blockMetadata.data_length);
        }

        return block_index;
    }

    /**
     * @param {Buffer} buf
     */
    static PARSE_BLOCK_METADATA(buf) {
        const block_metadata = {
            type: buf.readUInt16LE(0x00),
            header_length: buf.readUInt16LE(0x02),
            data_length: buf.readUInt32LE(0x04)
        };

        block_metadata.view = buf.slice(0, block_metadata.header_length + block_metadata.data_length);

        return block_metadata;
    }

    /**
     * @param {Block[]} blocks
     */
    static PROCESS_BLOCKS(blocks) {
        const result = {};

        blocks.forEach(block => {
            result[block.type] = RRMapParser.PARSE_BLOCK(block);
        });

        return result;
    }

    //TODO: Check if more values are in fact signed
    /**
     * @param {Block} block
     */
    static PARSE_BLOCK(block) {
        switch (block.type) {
            case BlockTypes.ROBOT_POSITION:
            case BlockTypes.CHARGER_LOCATION:
                return RRMapParser.PARSE_POSITION_BLOCK(block);
            case BlockTypes.IMAGE:
                return RRMapParser.PARSE_IMAGE_BLOCK(block);
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
            case BlockTypes.CURRENTLY_CLEANED_SEGMENTS:
                return this.PARSE_SEGMENTS_BLOCK(block);
        }
    }

    /**
     * @param {Block} block
     */
    static PARSE_POSITION_BLOCK(block) {
        return {
            position: [
                block.view.readUInt16LE(0x08),
                block.view.readUInt16LE(0x0c)
            ],
            angle: block.data_length >= 12 ? block.view.readInt32LE(0x10) : 0 // gen3+
        };
    }

    /**
     * @param {Block} block
     */
    static PARSE_PATH_BLOCK(block) {
        const points = [];

        for (let i = 0; i < block.data_length; i = i + 4) {
            //to draw these coordinates onto the map pixels, they have to be divided by 50
            points.push([
                block.view.readUInt16LE(0x14 + i),
                block.view.readUInt16LE(0x14 + i + 2)
            ]);
        }

        return {
            points: points,
            current_angle: block.view.readUInt32LE(0x10), //This is always 0. Roborock didn't bother
        };
    }

    /**
     * @param {Block} block
     */
    static PARSE_IMAGE_BLOCK(block) {
        const parsedBlock = {
            segments: {
                count: 0
            },
            pixels: {}
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
                view = block.view.slice(4);
                parsedBlock.segments.count = view.readInt32LE(0x04);
                mayContainSegments = true;
                break;

            default:
                throw new Error("Unsupported header length. Please file a bug report");
        }

        parsedBlock.position = {
            top: view.readInt32LE(0x08),
            left: view.readInt32LE(0x0c)
        };
        parsedBlock.dimensions = {
            height: view.readInt32LE(0x10),
            width: view.readInt32LE(0x14)
        };

        // position.left has to be position right for supporting the flipped map
        parsedBlock.position.top = Tools.DIMENSION_PIXELS - parsedBlock.position.top - parsedBlock.dimensions.height;

        //There can only be pixels if there is an image
        if (parsedBlock.dimensions.height > 0 && parsedBlock.dimensions.width > 0) {
            const imageData = {
                floor: [],
                obstacle_weak: [],
                obstacle_strong: []
            };

            for (let i = 0; i < block.data_length; i++) {
                const val = view[0x18 + i];

                if (val !== 0) {
                    const coords = [
                        i % parsedBlock.dimensions.width,
                        parsedBlock.dimensions.height-1 - Math.floor(i / parsedBlock.dimensions.width)
                    ];

                    let type = val & 0b00000111;
                    switch (type) {
                        case 0:
                            break;
                        case 1:
                            imageData.obstacle_strong.push(coords);
                            break;
                        default: {
                            imageData.floor.push(coords);

                            if (mayContainSegments) {
                                let segmentId = (val & 0b11111000) >> 3;

                                if (segmentId !== 0) {
                                    if (!imageData["segment_" + segmentId]) {
                                        imageData["segment_" + segmentId] = [];
                                    }

                                    imageData["segment_" + segmentId].push(coords);
                                }
                            }

                            break;
                        }
                    }
                }
            }

            parsedBlock.pixels = imageData;
        }

        return parsedBlock;
    }

    /**
     * @param {Block} block
     */
    static PARSE_GOTO_TARGET_BLOCK(block) {
        return {
            position: [
                block.view.readUInt16LE(0x08),
                block.view.readUInt16LE(0x0a)
            ]
        };
    }

    /**
     * @param {Block} block
     * @param {boolean} extended
     */
    static PARSE_STRUCTURES_BLOCK(block, extended) {
        const structureCount = block.view.readUInt32LE(0x08);
        const structures = [];

        if (structureCount > 0) {
            for (let i = 0; i < block.data_length; i = i + (extended === true ? 16 : 8)) {
                const structure = [
                    block.view.readUInt16LE(0x0c + i),
                    block.view.readUInt16LE(0x0c + i + 2),
                    block.view.readUInt16LE(0x0c + i + 4),
                    block.view.readUInt16LE(0x0c + i + 6)
                ];

                if (extended === true) {
                    structure.push(
                        block.view.readUInt16LE(0x0c + i + 8),
                        block.view.readUInt16LE(0x0c + i + 10),
                        block.view.readUInt16LE(0x0c + i + 12),
                        block.view.readUInt16LE(0x0c + i + 14)
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
        const segmentsCount = block.view.readUInt32LE(0x08);
        const segments = [];

        if (segmentsCount > 0) {
            for (let i = 0; i < block.data_length; i++) {
                segments.push(block.view.readUInt8(0x0c + i));
            }

            return segments;
        } else {
            return undefined;
        }
    }

    static POST_PROCESS_BLOCKS(metaData, blocks) {
        if (blocks[BlockTypes.IMAGE]) { //We need the image to flip everything else correctly
            const parsedMapData = Object.assign({}, metaData);

            parsedMapData.image = blocks[BlockTypes.IMAGE];

            [
                {
                    type: BlockTypes.PATH,
                    path: "path"
                },
                {
                    type: BlockTypes.GOTO_PATH,
                    path: "goto_path"
                },
                {
                    type: BlockTypes.GOTO_PREDICTED_PATH,
                    path: "goto_predicted_path"
                },
            ].forEach(item => {
                if (blocks[item.type]) {
                    parsedMapData[item.path] = blocks[item.type];
                    parsedMapData[item.path].points = parsedMapData[item.path].points.map(point => {
                        point[1] = Tools.DIMENSION_MM - point[1];
                        return point;
                    });

                    if (parsedMapData[item.path].points.length >= 2) {
                        parsedMapData[item.path].current_angle =
                            Math.atan2(
                                parsedMapData[item.path].points[parsedMapData[item.path].points.length - 1][1] -
                                parsedMapData[item.path].points[parsedMapData[item.path].points.length - 2][1],

                                parsedMapData[item.path].points[parsedMapData[item.path].points.length - 1][0] -
                                parsedMapData[item.path].points[parsedMapData[item.path].points.length - 2][0]

                            ) * 180 / Math.PI;
                    }
                }
            });

            if (blocks[BlockTypes.CHARGER_LOCATION]) {
                parsedMapData.charger = blocks[BlockTypes.CHARGER_LOCATION].position;
                parsedMapData.charger[1] = Tools.DIMENSION_MM - parsedMapData.charger[1];
            }

            if (blocks[BlockTypes.ROBOT_POSITION]) {
                parsedMapData.robot = blocks[BlockTypes.ROBOT_POSITION].position;
                parsedMapData.robot[1] = Tools.DIMENSION_MM - parsedMapData.robot[1];
            }

            if (blocks[BlockTypes.GOTO_TARGET]) {
                parsedMapData.goto_target = blocks[BlockTypes.GOTO_TARGET].position;
                parsedMapData.goto_target[1] = Tools.DIMENSION_MM - parsedMapData.goto_target[1];
            }

            if (blocks[BlockTypes.CURRENTLY_CLEANED_ZONES]) {
                parsedMapData.currently_cleaned_zones = blocks[BlockTypes.CURRENTLY_CLEANED_ZONES];
                parsedMapData.currently_cleaned_zones = parsedMapData.currently_cleaned_zones.map(zone => {
                    zone[1] = Tools.DIMENSION_MM - zone[1];
                    zone[3] = Tools.DIMENSION_MM - zone[3];

                    return zone;
                });
            }

            if (blocks[BlockTypes.NO_GO_AREAS]) {
                parsedMapData.no_go_areas = blocks[BlockTypes.NO_GO_AREAS];
                parsedMapData.no_go_areas = parsedMapData.no_go_areas.map(area => {
                    area[1] = Tools.DIMENSION_MM - area[1];
                    area[3] = Tools.DIMENSION_MM - area[3];
                    area[5] = Tools.DIMENSION_MM - area[5];
                    area[7] = Tools.DIMENSION_MM - area[7];

                    return area;
                });
            }

            if (blocks[BlockTypes.VIRTUAL_WALLS]) {
                parsedMapData.virtual_walls = blocks[BlockTypes.VIRTUAL_WALLS];
                parsedMapData.virtual_walls = parsedMapData.virtual_walls.map(wall => {
                    wall[1] = Tools.DIMENSION_MM - wall[1];
                    wall[3] = Tools.DIMENSION_MM - wall[3];

                    return wall;
                });
            }

            if (blocks[BlockTypes.CURRENTLY_CLEANED_SEGMENTS]) {
                parsedMapData.currently_cleaned_segments = blocks[BlockTypes.CURRENTLY_CLEANED_SEGMENTS];
            }

            return parsedMapData;
        } else {
            return null;
        }
    }
}

module.exports = RRMapParser;