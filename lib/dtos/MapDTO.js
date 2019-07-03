const Tools = require("./Tools");

/**
 * @param options {object}
 * @param [options.rawData] {Buffer} //seems to be not used anywhere
 * @param [options.parsedData] {object}
 * @param [options.hash] {string}
 */
const MapDTO = function(options) { //TODO: needs jsdoc. maybe validation?
//    this.rawData = options.rawData || null; //seems to be not used anywhere
    this.parsedData = options.parsedData || null;
    this.hash = options.hash || null;

    /**
     Parsing part
     **/
    const PARSER_TYPES = {
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
        "DIGEST": 1024
    };

    const PARSE_BLOCK = function parseBlock(buf, offset, result) {
        result = result || {};
        if (buf.length <= offset) {
            return result;
        }
        let type_based_offset = 0x0;

        var type = buf.readUInt16LE(0x00 + offset);
        var length = buf.readUInt32LE(0x04 + offset);

        //TODO: Check if more values are in fact signed
        switch (type) {
            case PARSER_TYPES.ROBOT_POSITION:
            case PARSER_TYPES.CHARGER_LOCATION:
                result[type] = {
                    position: [
                        buf.readUInt16LE(0x08 + offset),
                        buf.readUInt16LE(0x0c + offset)
                    ]
                };
                break;
            case PARSER_TYPES.IMAGE:
                const parameters = {
                    position: {
                        top: buf.readInt32LE(0x08 + offset),
                        left: buf.readInt32LE(0x0c + offset)
                    },
                    dimensions: {
                        height: buf.readInt32LE(0x10 + offset),
                        width: buf.readInt32LE(0x14 + offset)
                    },
                    pixels: []
                };

                // position.left has to be position right for supporting the flipped map
                parameters.position.top = Tools.DIMENSION_PIXELS - parameters.position.top - parameters.dimensions.height;

                //There can only be pixels if there is an image
                if(parameters.dimensions.height > 0 && parameters.dimensions.width > 0) {
                    parameters.pixels = {
                        floor: [],
                        obstacle_weak: [],
                        obstacle_strong: []
                    };

                    for (let i = 0; i < length; i++) {
                        const val = buf.readUInt8(0x18 + offset + i);
                        let coords;

                        if(val !== 0) {
                            coords = [
                                i % parameters.dimensions.width,
                                parameters.dimensions.height-1 - Math.floor(i / parameters.dimensions.width)
                            ];

                            switch(val) {
                                case 1:
                                    parameters.pixels.obstacle_strong.push(coords);
                                    break;
                                case 8:
                                    parameters.pixels.obstacle_weak.push(coords);
                                    break;
                                case 255:
                                    parameters.pixels.floor.push(coords);
                                    break;
                            }
                        }
                    }
                }

                result[type] = parameters;

                type_based_offset = 0x10;
                break;
            case PARSER_TYPES.PATH:
            case PARSER_TYPES.GOTO_PATH:
            case PARSER_TYPES.GOTO_PREDICTED_PATH:
                const points = [];
                for (let i = 0; i < length; i = i + 4) {
                    //to draw these coordinates onto the map pixels, they have to be divided by 50
                    points.push([
                        buf.readUInt16LE(0x14 + offset + i),
                        buf.readUInt16LE(0x14 + offset + i + 2)
                    ]);
                }

                result[type] = {
                    //point_count: buf.readUInt32LE(0x08 + offset),
                    //point_size: buf.readUInt32LE(0x0c + offset),
                    current_angle: buf.readUInt32LE(0x10 + offset), //This is always 0. Roborock didn't bother
                    points: points
                };

                type_based_offset = 0x0c;
                break;
            case PARSER_TYPES.GOTO_TARGET:
                result[type] = {
                    position: [
                        buf.readUInt16LE(0x08 + offset),
                        buf.readUInt16LE(0x0a + offset)
                    ]
                };
                break;
            case PARSER_TYPES.CURRENTLY_CLEANED_ZONES:
                const zoneCount = buf.readUInt32LE(0x08 + offset);
                const zones = [];

                if(zoneCount > 0) {
                    for (let i = 0; i < length; i = i + 8) {
                        zones.push([
                            buf.readUInt16LE(0x0c + offset + i),
                            buf.readUInt16LE(0x0c + offset + i + 2),
                            buf.readUInt16LE(0x0c + offset + i + 4),
                            buf.readUInt16LE(0x0c + offset + i + 6)
                        ]);
                    }

                    result[type] = zones;
                }

                type_based_offset = 0x04;
                break;
            case PARSER_TYPES.NO_GO_AREAS:
                const noGoAreaCount = buf.readUInt32LE(0x08 + offset);
                const noGoAreas = [];

                if(noGoAreaCount > 0) {
                    for (let i = 0; i < length; i = i + 16) {
                        noGoAreas.push([
                            buf.readUInt16LE(0x0c + offset + i),
                            buf.readUInt16LE(0x0c + offset + i + 2),
                            buf.readUInt16LE(0x0c + offset + i + 4),
                            buf.readUInt16LE(0x0c + offset + i + 6),
                            buf.readUInt16LE(0x0c + offset + i + 8),
                            buf.readUInt16LE(0x0c + offset + i + 10),
                            buf.readUInt16LE(0x0c + offset + i + 12),
                            buf.readUInt16LE(0x0c + offset + i + 14)
                        ]);
                    }

                    result[type] = noGoAreas;
                }

                type_based_offset = 0x04;
                break;
            case PARSER_TYPES.VIRTUAL_WALLS:
                const wallCount = buf.readUInt32LE(0x08 + offset);
                const walls = [];

                if(wallCount > 0) {
                    for (let i = 0; i < length; i = i + 8) {
                        walls.push([
                            buf.readUInt16LE(0x0c + offset + i),
                            buf.readUInt16LE(0x0c + offset + i + 2),
                            buf.readUInt16LE(0x0c + offset + i + 4),
                            buf.readUInt16LE(0x0c + offset + i + 6)
                        ]);
                    }

                    result[type] = walls
                }

                type_based_offset = 0x04;
                break;
            case PARSER_TYPES.DIGEST:
                break;
            default: //TODO: Only enable for development since it will spam the log
                //console.error("Unknown Data Block of type " + type + " at offset " + offset + " with length " + length);
        }

        return parseBlock(buf, 0x08 + length + offset + type_based_offset, result);
    };


    /**
     *
     * @param mapBuf {Buffer} Should contain map in RRMap Format
     * @return {null|object}
     */
    const PARSE = function parse(mapBuf) {
        if (mapBuf[0x00] === 0x72 && mapBuf[0x01] === 0x72) {// rr
            const blocks = PARSE_BLOCK(mapBuf, 0x14);
            const parsedMapData = {
                header_length: mapBuf.readUInt16LE(0x02),
                data_length: mapBuf.readUInt16LE(0x04),
                version: {
                    major: mapBuf.readUInt16LE(0x08),
                    minor: mapBuf.readUInt16LE(0x0A)
                },
                map_index: mapBuf.readUInt16LE(0x0C),
                map_sequence: mapBuf.readUInt16LE(0x10)
            };


            if (blocks[PARSER_TYPES.IMAGE]) { //We need the image to flip everything else correctly
                parsedMapData.image = blocks[PARSER_TYPES.IMAGE];

                [
                    {
                        type: PARSER_TYPES.PATH,
                        path: "path"
                    },
                    {
                        type: PARSER_TYPES.GOTO_PATH,
                        path: "goto_path"
                    },
                    {
                        type: PARSER_TYPES.GOTO_PREDICTED_PATH,
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

                if (blocks[PARSER_TYPES.CHARGER_LOCATION]) {
                    parsedMapData.charger = blocks[PARSER_TYPES.CHARGER_LOCATION].position;
                    parsedMapData.charger[1] = Tools.DIMENSION_MM - parsedMapData.charger[1];
                }

                if (blocks[PARSER_TYPES.ROBOT_POSITION]) {
                    parsedMapData.robot = blocks[PARSER_TYPES.ROBOT_POSITION].position;
                    parsedMapData.robot[1] = Tools.DIMENSION_MM - parsedMapData.robot[1];
                }

                if(blocks[PARSER_TYPES.GOTO_TARGET]) {
                    parsedMapData.goto_target = blocks[PARSER_TYPES.GOTO_TARGET].position;
                    parsedMapData.goto_target[1] = Tools.DIMENSION_MM - parsedMapData.goto_target[1];
                }

                if(blocks[PARSER_TYPES.CURRENTLY_CLEANED_ZONES]) {
                    parsedMapData.currently_cleaned_zones = blocks[PARSER_TYPES.CURRENTLY_CLEANED_ZONES];
                    parsedMapData.currently_cleaned_zones = parsedMapData.currently_cleaned_zones.map(zone => {
                        zone[1] = Tools.DIMENSION_MM - zone[1];
                        zone[3] = Tools.DIMENSION_MM - zone[3];

                        return zone;
                    });
                }

                if(blocks[PARSER_TYPES.NO_GO_AREAS]) {
                    parsedMapData.no_go_areas = blocks[PARSER_TYPES.NO_GO_AREAS];
                    parsedMapData.no_go_areas = parsedMapData.no_go_areas.map(area => {
                        area[1] = Tools.DIMENSION_MM - area[1];
                        area[3] = Tools.DIMENSION_MM - area[3];
                        area[5] = Tools.DIMENSION_MM - area[5];
                        area[7] = Tools.DIMENSION_MM - area[7];

                        return area;
                    })
                }

                if(blocks[PARSER_TYPES.VIRTUAL_WALLS]) {
                    parsedMapData.virtual_walls = blocks[PARSER_TYPES.VIRTUAL_WALLS];
                    parsedMapData.virtual_walls = parsedMapData.virtual_walls.map(wall => {
                        wall[1] = Tools.DIMENSION_MM - wall[1];
                        wall[3] = Tools.DIMENSION_MM - wall[3];

                        return wall;
                    });
                }

                return parsedMapData;
            } else {
                return null;
            }
        } else {
            return null;
        }
    };
};

module.exports = MapDTO;