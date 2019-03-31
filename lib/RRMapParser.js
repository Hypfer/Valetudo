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

            //There can only be pixels if there is an image
            if(parameters.dimensions.height > 0 && parameters.dimensions.width > 0) {
                for (let i = 0; i <= length; i++) {
                    parameters.pixels.push([
                        i % parameters.dimensions.width,
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
                current_angle: buf.readUInt32LE(0x10 + offset),
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
        case 9: //TODO What is this?
            type_based_offset = 0x10; //TODO: Is this always correct?
            break;
        case RRMapParser.TYPES.DIGEST:
            break;
        default:
            console.error("Unknown Data Block of type " + type + " at offset " + offset + " with length " + length);
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


        if (blocks[RRMapParser.TYPES.IMAGE]) {
            parsedMapData.image = blocks[RRMapParser.TYPES.IMAGE];
        }

        if (blocks[RRMapParser.TYPES.PATH]) {
            parsedMapData.path = blocks[RRMapParser.TYPES.PATH];
        }

        if (blocks[RRMapParser.TYPES.CHARGER_LOCATION]) {
            parsedMapData.charger = blocks[RRMapParser.TYPES.CHARGER_LOCATION].position;
        }

        if (blocks[RRMapParser.TYPES.ROBOT_POSITION]) {
            parsedMapData.robot = blocks[RRMapParser.TYPES.ROBOT_POSITION].position;
        }

        if(parsedMapData.image) { //just to be sure.
            return parsedMapData;
        } else {
            return null;
        }
    } else {
        return null;
    }
};

module.exports = RRMapParser;