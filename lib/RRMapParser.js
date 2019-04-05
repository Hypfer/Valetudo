const Tools = require("./Tools");

const RRMapParser = function() {};

RRMapParser.TYPES = {
    "CHARGER_LOCATION": 1,
    "IMAGE": 2,
    "PATH": 3,
    "ROBOT_POSITION": 8,
    "DIGEST": 1024
};

RRMapParser.PARSE_BLOCK = function parseBlock(buf, offset, result) {
    result = result || {};
    if (buf.length <= offset) {
        return result;
    }
    let type_based_offset = 0x0;

    var type = buf.readUInt16LE(0x00 + offset);
    var length = buf.readUInt32LE(0x04 + offset);

    switch (type) {
        case RRMapParser.TYPES.CHARGER_LOCATION:
            result[type] = {
                unknown_property: buf.readUInt16LE(0x02 + offset),
                position: [
                    buf.readUInt16LE(0x08 + offset),
                    buf.readUInt16LE(0x0c + offset)
                ]
            };
            break;
        case RRMapParser.TYPES.IMAGE:
            const parameters = {
                position: {
                    top: buf.readUInt32LE(0x08 + offset),
                    left: buf.readUInt32LE(0x0c + offset)
                },
                dimensions: {
                    height: buf.readUInt32LE(0x10 + offset),
                    width: buf.readUInt32LE(0x14 + offset)
                },
                pixels: []
            };

            // position.left has to be position right for supporting the flipped map
            parameters.position.left = Tools.DIMENSION_PIXELS - parameters.position.left - parameters.dimensions.width;

            //There can only be pixels if there is an image
            if(parameters.dimensions.height > 0 && parameters.dimensions.width > 0) {
                for (let i = 0; i <= length; i++) {
                    parameters.pixels.push([
                        parameters.dimensions.width-1 - i % parameters.dimensions.width,
                        Math.floor(i / parameters.dimensions.width),
                        buf.readUInt8(0x18 + offset + i)
                    ]);
                }
            }

            result[type] = parameters;

            type_based_offset = 0x10;
            break;
        case RRMapParser.TYPES.PATH:
            var points = [];
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
        case RRMapParser.TYPES.ROBOT_POSITION:
            result[type] = {
                position: [
                    buf.readUInt32LE(0x08 + offset),
                    buf.readUInt32LE(0x0c + offset)
                ]
            };
            break;
        case 5: //TODO These appear while the robot is executing a go-to command
        case 7:
            break;
        case 6: //TODO: most likely zones. Appears on zoned cleanup
            break;
        case 9: //TODO What is this?
            type_based_offset = 0x10; //TODO: Is this always correct?
            break;
        case RRMapParser.TYPES.DIGEST:
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
RRMapParser.PARSE = function parse(mapBuf) {
    if (mapBuf[0x00] === 0x72 && mapBuf[0x01] === 0x72) {// rr
        const blocks = RRMapParser.PARSE_BLOCK(mapBuf, 0x14);
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


        if (blocks[RRMapParser.TYPES.IMAGE]) { //We need the image to flip everything else correctly
            parsedMapData.image = blocks[RRMapParser.TYPES.IMAGE];

            if (blocks[RRMapParser.TYPES.PATH]) {
                parsedMapData.path = blocks[RRMapParser.TYPES.PATH];
                parsedMapData.path.points = parsedMapData.path.points.map(point => {
                    point[0] = Tools.DIMENSION_MM - point[0];
                    return point;
                });

                if (parsedMapData.path.points.length >= 2) {
                    parsedMapData.path.current_angle =
                        Math.atan2(
                            parsedMapData.path.points[parsedMapData.path.points.length - 1][1] -
                            parsedMapData.path.points[parsedMapData.path.points.length - 2][1],

                            parsedMapData.path.points[parsedMapData.path.points.length - 1][0] -
                            parsedMapData.path.points[parsedMapData.path.points.length - 2][0]

                        ) * 180 / Math.PI;
                }
            }

            if (blocks[RRMapParser.TYPES.CHARGER_LOCATION]) {
                parsedMapData.charger = blocks[RRMapParser.TYPES.CHARGER_LOCATION].position;
                parsedMapData.charger[0] = Tools.DIMENSION_MM - parsedMapData.charger[0];
            }

            if (blocks[RRMapParser.TYPES.ROBOT_POSITION]) {
                parsedMapData.robot = blocks[RRMapParser.TYPES.ROBOT_POSITION].position;
                parsedMapData.robot[0] = Tools.DIMENSION_MM - parsedMapData.robot[0];
            }

            return parsedMapData;
        } else {
            return null;
        }
    } else {
        return null;
    }
};

module.exports = RRMapParser;