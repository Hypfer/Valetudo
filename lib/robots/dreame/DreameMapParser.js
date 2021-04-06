const Logger = require("../../Logger");
const Map = require("../../entities/map");
const zlib = require("zlib");

/**
 * P-Frames contain relative changes to the previous I- or even P-Frame
 *
 * That means that e.g. positions parsed from p-frames require the most recent previous absolute position to make sense
 */

class DreameMapParser {
    /**
     * This expects the already inflated buffer.
     * Since there are no magic bytes, there's no real way to do sanity checking which is sad.
     *
     * :(
     *
     * @param {Buffer} buf
     * @param {MapDataType} [type]
     * @returns {null|import("../../entities/map/ValetudoMap")}
     */
    static PARSE(buf, type) {
        //Maps are always at least 27 bytes in size
        if (!buf || buf.length < HEADER_SIZE) {
            return null;
        }

        if (!type) {
            type = MAP_DATA_TYPES.REGULAR;
        }

        const parsedHeader = DreameMapParser.PARSE_HEADER(buf.slice(0, HEADER_SIZE));


        /**
         * Since P-Frame parsing is much harder than I-Frame parsing, we're skipping them for now
         *
         * If someone some day feels insanely motivated, feel free to add P-Frame support.
         */
        if (parsedHeader.frame_type !== FRAME_TYPES.I) {
            return null;
        }

        const layers = [];
        const entities = [];

        if (parsedHeader.robot_position.valid === true) {
            entities.push(
                new Map.PointMapEntity({
                    points: [
                        parsedHeader.robot_position.x,
                        parsedHeader.robot_position.y
                    ],
                    metaData: {
                        angle: DreameMapParser.CONVERT_ANGLE_TO_VALETUDO(parsedHeader.robot_position.angle)
                    },
                    type: Map.PointMapEntity.TYPE.ROBOT_POSITION
                })
            );
        }

        if (parsedHeader.charger_position.valid === true) {
            entities.push(
                new Map.PointMapEntity({
                    points: [
                        parsedHeader.charger_position.x,
                        parsedHeader.charger_position.y
                    ],
                    metaData: {
                        angle: DreameMapParser.CONVERT_ANGLE_TO_VALETUDO(parsedHeader.charger_position.angle)
                    },
                    type: Map.PointMapEntity.TYPE.CHARGER_LOCATION
                })
            );
        }


        if (buf.length >= HEADER_SIZE + parsedHeader.width * parsedHeader.height) {
            const imageData = buf.slice(HEADER_SIZE, HEADER_SIZE + parsedHeader.width * parsedHeader.height);
            const activeSegmentIds = [];
            const segmentNames = {};
            let additionalData = {};

            try {
                additionalData = JSON.parse(buf.slice(parsedHeader.width * parsedHeader.height + HEADER_SIZE).toString());
            } catch (e) {
                Logger.warn("Error while parsing additional map data", e);
            }

            if (additionalData.sa && Array.isArray(additionalData.sa)) {
                additionalData.sa.forEach(sa => {
                    activeSegmentIds.push(sa[0]);
                });
            }

            if (additionalData.seg_inf) {
                Object.keys(additionalData.seg_inf).forEach(segmentId => {
                    if (additionalData.seg_inf[segmentId].name) {
                        segmentNames[segmentId] = Buffer.from(additionalData.seg_inf[segmentId].name, "base64").toString("utf8");
                    }
                });
            }

            layers.push(...DreameMapParser.PARSE_IMAGE(parsedHeader, activeSegmentIds, segmentNames, imageData, type));

            /**
             * Contains saved map data such as virtual restrictions as well as segments
             */
            if (additionalData.rism) { //TODO: SM = Saved Map?
                const rismResult = DreameMapParser.PARSE(DreameMapParser.PREPROCESS(additionalData.rism), MAP_DATA_TYPES.RISM);

                if (rismResult instanceof Map.ValetudoMap) {
                    rismResult.entities.forEach(e => {
                        if (e instanceof Map.PointMapEntity) {
                            if (e.type === Map.PointMapEntity.TYPE.ROBOT_POSITION && parsedHeader.robot_position.valid === false) {
                                entities.push(e);
                            }
                            if (e.type === Map.PointMapEntity.TYPE.CHARGER_LOCATION && parsedHeader.charger_position.valid === false) {
                                entities.push(e);
                            }
                        } else if (e instanceof Map.PolygonMapEntity) {
                            if (
                                e.type === Map.PolygonMapEntity.TYPE.NO_GO_AREA ||
                                e.type === Map.PolygonMapEntity.TYPE.NO_MOP_AREA
                            ) {
                                entities.push(e);
                            }
                        } else if (e instanceof Map.LineMapEntity && e.type === Map.LineMapEntity.TYPE.VIRTUAL_WALL) {
                            entities.push(e);
                        }
                    });

                    rismResult.layers.forEach(l => {
                        if (l.metaData.segmentId !== undefined) {
                            if (activeSegmentIds.includes(parseInt(l.metaData.segmentId))) { //required for the 1C
                                l.metaData.active = true;
                            }

                            if (layers.findIndex(eL => eL.metaData.segmentId === l.metaData.segmentId) === -1) {
                                layers.push(l);
                            } else {
                                if (l.metaData.name) {
                                    layers.find(eL => eL.metaData.segmentId === l.metaData.segmentId).metaData.name = l.metaData.name;
                                }
                            }
                        } else {
                            if (layers.findIndex(eL => eL.type === l.type) === -1) {
                                layers.push(l);
                            }
                        }
                    });
                }
            }


            if (additionalData.tr) {
                const pathPoints = DreameMapParser.PARSE_PATH(parsedHeader, additionalData.tr, additionalData.l2r === 1);

                if (pathPoints?.length > 0) {
                    entities.push(
                        new Map.PathMapEntity({
                            points: pathPoints,
                            type: Map.PathMapEntity.TYPE.PATH
                        })
                    );
                }

            }

            if (Array.isArray(additionalData.da)) { //1C
                entities.push(
                    ...DreameMapParser.PARSE_AREAS(
                        parsedHeader,
                        [additionalData.da],
                        Map.PolygonMapEntity.TYPE.ACTIVE_ZONE
                    )
                );
            }

            if (additionalData.da2 && Array.isArray(additionalData.da2.areas)) {
                entities.push(
                    ...DreameMapParser.PARSE_AREAS(
                        parsedHeader,
                        additionalData.da2.areas,
                        Map.PolygonMapEntity.TYPE.ACTIVE_ZONE
                    )
                );
            }

            if (additionalData.vw) {
                if (Array.isArray(additionalData.vw.rect)) {
                    entities.push(
                        ...DreameMapParser.PARSE_AREAS(
                            parsedHeader,
                            additionalData.vw.rect,
                            Map.PolygonMapEntity.TYPE.NO_GO_AREA
                        )
                    );
                }

                if (Array.isArray(additionalData.vw.mop)) {
                    entities.push(
                        ...DreameMapParser.PARSE_AREAS(
                            parsedHeader,
                            additionalData.vw.mop,
                            Map.PolygonMapEntity.TYPE.NO_MOP_AREA
                        )
                    );
                }

                if (Array.isArray(additionalData.vw.line)) {
                    entities.push(
                        ...DreameMapParser.PARSE_LINES(
                            parsedHeader,
                            additionalData.vw.line,
                            Map.LineMapEntity.TYPE.VIRTUAL_WALL
                        )
                    );
                }
            }
        } else {
            //Just a header
            return null;
        }

        return new Map.ValetudoMap({
            size: {
                x: MAX_X,
                y: MAX_Y
            },
            pixelSize: parsedHeader.pixelSize,
            layers: layers,
            entities: entities
        });
    }

    static PARSE_HEADER(buf) {
        const parsedHeader = {
            robot_position: {},
            charger_position: {}
        };

        parsedHeader.id = buf.readInt16LE();
        parsedHeader.frame_id = buf.readInt16LE(2);
        parsedHeader.frame_type = buf.readInt8(4);

        parsedHeader.robot_position = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(buf.readInt16LE(5), buf.readInt16LE(7));
        parsedHeader.robot_position.angle = buf.readInt16LE(9);
        parsedHeader.robot_position.valid = true;

        parsedHeader.charger_position = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(buf.readInt16LE(11), buf.readInt16LE(13));
        parsedHeader.charger_position.angle = buf.readInt16LE(15);
        parsedHeader.charger_position.valid = true;

        parsedHeader.pixelSize = Math.round(buf.readInt16LE(17) / 10);

        parsedHeader.width = buf.readInt16LE(19);
        parsedHeader.height = buf.readInt16LE(21);

        parsedHeader.left = Math.round((buf.readInt16LE(23) + HALF_INT16 )/ 10);
        parsedHeader.top = Math.round((buf.readInt16LE(25) + HALF_INT16) / 10);


        if (buf.readInt16LE(5) === HALF_INT16_UPPER_HALF && buf.readInt16LE(7) === HALF_INT16_UPPER_HALF) {
            parsedHeader.robot_position.valid = false;
        }

        if (buf.readInt16LE(11) === HALF_INT16_UPPER_HALF && buf.readInt16LE(13) === HALF_INT16_UPPER_HALF) {
            parsedHeader.charger_position.valid = false;
        }

        return parsedHeader;
    }

    static PARSE_IMAGE(parsedHeader, activeSegmentIds, segmentNames, buf, type) {
        const floorPixels = [];
        const wallPixels = [];
        const segments = {};

        const layers = [];

        for (let i = 0; i < parsedHeader.height; i++) {
            for (let j = 0; j < parsedHeader.width; j++) {

                const coords = [
                    j + ((parsedHeader.left)/parsedHeader.pixelSize),
                    i + ((parsedHeader.top)/parsedHeader.pixelSize)
                ];

                /**
                 * The valetudo map origin is in the top left corner
                 * The dreame map origin is in the bottom left corner
                 *
                 * Therefore, we need to flip this and every Y coordinate
                 */
                coords[1] = (MAX_Y / parsedHeader.pixelSize) - coords[1];

                coords[0] = Math.round(coords[0]);
                coords[1] = Math.round(coords[1]);



                if (type === MAP_DATA_TYPES.REGULAR) {
                    /**
                     * A regular Pixel is one byte consisting of
                     *      000000               00
                     *      The segment ID       The Type
                     */
                    const px = buf[(i * parsedHeader.width) + j];

                    const segmentId = px >> 2;

                    if (segmentId > 0 && segmentId < 62) { //62 is newly discovered floor
                        if (!segments[segmentId]) {
                            segments[segmentId] = [];
                        }

                        segments[segmentId].push(...coords);
                    } else {
                        switch (px & 0b00000011) {
                            case PIXEL_TYPES.NONE:
                                break;
                            case PIXEL_TYPES.FLOOR:
                                floorPixels.push(...coords);
                                break;
                            case PIXEL_TYPES.WALL:
                                wallPixels.push(...coords);
                                break;
                            default:
                                Logger.warn("Unhandled pixel type", px);
                        }
                    }
                } else if (type === MAP_DATA_TYPES.RISM) {
                    /**
                     * A rism Pixel is one byte consisting of
                     *      1                  0000000
                     *      isWall flag       The Segment ID
                     */
                    const px = buf[(i * parsedHeader.width) + j];

                    const segmentId = px & 0b01111111;
                    const wallFlag = px >> 7;

                    if (wallFlag) {
                        wallPixels.push(...coords);
                    } else if (segmentId > 0) {
                        if (!segments[segmentId]) {
                            segments[segmentId] = [];
                        }

                        segments[segmentId].push(...coords);
                    }
                }
            }
        }

        if (floorPixels.length > 0) {
            layers.push(
                new Map.MapLayer({
                    pixels: floorPixels,
                    type: Map.MapLayer.TYPE.FLOOR
                })
            );
        }

        if (wallPixels.length > 0) {
            layers.push(
                new Map.MapLayer({
                    pixels: wallPixels,
                    type: Map.MapLayer.TYPE.WALL
                })
            );
        }

        Object.keys(segments).forEach(segmentId => {
            const metaData = {
                segmentId: parseInt(segmentId),
                active: activeSegmentIds.includes(parseInt(segmentId)),
                source: type
            };

            if (segmentNames[segmentId]) {
                metaData.name = segmentNames[segmentId];
            }

            layers.push(
                new Map.MapLayer({
                    pixels: segments[segmentId],
                    type: Map.MapLayer.TYPE.SEGMENT,
                    metaData: metaData
                })
            );
        });

        return layers;
    }


    static PARSE_PATH(parsedHeader, traceString, appendRobotPosition) {
        const points = [];
        const path = [];
        const traceElements = traceString.split(",");
        const entryPointString = traceElements[0]; //the entrypoint is the first point

        let previousPoint = {
            x: 0,
            y: 0,
            isLine: undefined,
            isAbsolute: undefined
        };

        let currentPoint = {
            x: parseInt(entryPointString.substring(1)),
            y: undefined,
            isLine: entryPointString.startsWith("L") || entryPointString.startsWith("l"),
            isAbsolute: entryPointString.startsWith("l")
        };

        for (let i = 1; i < traceElements.length; i++) {
            const currentElemString = traceElements[i];
            const currentSplitElem = currentElemString.split(/[LS]/);

            const newY = parseInt(currentSplitElem[0]);

            if (currentPoint.isLine && !currentPoint.isAbsolute) {
                currentPoint.y = previousPoint.y ? previousPoint.y + newY : newY;
            } else {
                currentPoint.y = newY;
            }

            points.push(currentPoint);
            previousPoint = currentPoint;

            if (currentSplitElem.length > 1) {
                // wth
                // @ts-ignore
                currentPoint = {
                    x: parseInt(currentSplitElem[1])
                };
            }

            if (currentElemString.includes("L")) {
                currentPoint.isLine = true;
                currentPoint.x = previousPoint.x ? previousPoint.x + currentPoint.x : currentPoint.x;
            } else if (currentElemString.includes("S")) {
                currentPoint.isLine = false;
            }
        }

        points.forEach(e => {
            const p = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(e.x, e.y);

            path.push(p.x, p.y);
        });

        if (appendRobotPosition) {
            path.push(parsedHeader.robot_position.x, parsedHeader.robot_position.y);
        }


        return path;
    }

    static PARSE_AREAS(parsedHeader, areas, type) {
        return areas.map(a => {
            const pA = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[0], a[1]);
            const pB = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[0], a[3]);
            const pC = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[2], a[3]);
            const pD = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[2], a[1]);


            return new Map.PolygonMapEntity({
                type: type,
                points: [pA.x, pA.y,pB.x, pB.y,pC.x, pC.y,pD.x, pD.y]
            });
        });
    }

    static PARSE_LINES(parsedHeader, lines, type) {
        return lines.map(a => {
            const pA = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[0], a[1]);
            const pB = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[2], a[3]);


            return new Map.LineMapEntity({
                type: type,
                points: [pA.x,pA.y,pB.x,pB.y]
            });
        });
    }

    /**
     * Uploaded dreame Maps are actually base64url strings of zlib compressed data
     *
     * https://tools.ietf.org/html/rfc4648#section-5
     *
     *
     * @param {any} data
     * @returns {Buffer}
     */
    static PREPROCESS(data) {
        const base64String = data.toString().replace(/_/g, "/").replace(/-/g, "+");

        return zlib.inflateSync(Buffer.from(base64String, "base64"));
    }
}

const PIXEL_TYPES = Object.freeze({
    NONE: 0,
    FLOOR: 1,
    WALL: 2
});

const FRAME_TYPES = Object.freeze({
    I: 73,
    P: 80
});

/**
 *  @typedef {string} MapDataType
 *  @enum {string}
 *
 */
const MAP_DATA_TYPES = Object.freeze({
    REGULAR: "regular",
    RISM: "rism"
});

const HALF_INT16 = 32768;
const HALF_INT16_UPPER_HALF = 32767;
const HEADER_SIZE = 27;
const MAX_X = Math.round(((HALF_INT16 + HALF_INT16_UPPER_HALF)/10));
const MAX_Y = Math.round(((HALF_INT16 + HALF_INT16_UPPER_HALF)/10));

DreameMapParser.HALF_INT16 = HALF_INT16;

/**
 * Dreame coordinates are signed INT16. Valetudo coordinates are unsigned
 * Therefore, every absolute position needs to be shifted by half an INT16
 *
 * The valetudo map origin is in the top left corner
 * The dreame map origin is in the bottom left corner
 *
 * Therefore, we need to flip this and every Y coordinate
 *
 *
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES = function(x, y) {
    return {
        x: Math.round((x + HALF_INT16)/10),
        y: MAX_Y - Math.round((y + HALF_INT16)/10)
    };
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
DreameMapParser.CONVERT_TO_DREAME_COORDINATES = function(x, y) {
    return {
        x: (x*10) - HALF_INT16,
        y: (-1 * HALF_INT16) - ((y - MAX_Y) * 10) //thanks denna!
    };
};

DreameMapParser.CONVERT_ANGLE_TO_VALETUDO = function(angle) {
    //This flips the angle at the Y-axis due to our different coordinate system and then substracts 90° from it
    return ((angle < 180 ? 180 - angle : 360 - angle + 180) + 270) % 360;
};

module.exports = DreameMapParser;
