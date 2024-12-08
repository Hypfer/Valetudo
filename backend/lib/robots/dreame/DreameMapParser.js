const DreameConst = require("./DreameConst");
const Logger = require("../../Logger");
const mapEntities = require("../../entities/map");
const uuid = require("uuid");
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
     * @returns {Promise<null|import("../../entities/map/ValetudoMap")>}
     */
    static async PARSE(buf, type) {
        //Maps are always at least 27 bytes in size
        if (!buf || buf.length < HEADER_SIZE) {
            return null;
        }

        if (!type) {
            type = MAP_DATA_TYPES.REGULAR;
        }

        const parsedHeader = DreameMapParser.PARSE_HEADER(buf.subarray(0, HEADER_SIZE));


        // Since P-Frame parsing is much harder than I-Frame parsing, we're skipping them
        if (parsedHeader.frame_type !== FRAME_TYPES.I) {
            return null;
        }

        const layers = [];
        const entities = [];
        const metaData = {};

        if (parsedHeader.robot_position.valid === true) {
            entities.push(
                new mapEntities.PointMapEntity({
                    points: [
                        parsedHeader.robot_position.x,
                        parsedHeader.robot_position.y
                    ],
                    metaData: {
                        angle: DreameMapParser.CONVERT_ANGLE_TO_VALETUDO(parsedHeader.robot_position.angle)
                    },
                    type: mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
                })
            );
        }

        if (parsedHeader.charger_position.valid === true) {
            entities.push(
                new mapEntities.PointMapEntity({
                    points: [
                        parsedHeader.charger_position.x,
                        parsedHeader.charger_position.y
                    ],
                    metaData: {
                        angle: DreameMapParser.CONVERT_ANGLE_TO_VALETUDO(parsedHeader.charger_position.angle)
                    },
                    type: mapEntities.PointMapEntity.TYPE.CHARGER_LOCATION
                })
            );
        }


        if (buf.length >= HEADER_SIZE + parsedHeader.width * parsedHeader.height) {
            const imageData = buf.subarray(HEADER_SIZE, HEADER_SIZE + parsedHeader.width * parsedHeader.height);
            const activeSegmentIds = [];
            const segmentNames = {};
            let additionalData = {};

            try {
                additionalData = JSON.parse(buf.subarray(parsedHeader.width * parsedHeader.height + HEADER_SIZE).toString());
            } catch (e) {
                Logger.warn("Error while parsing additional map data", e);
            }

            if (additionalData.sa && Array.isArray(additionalData.sa)) {
                additionalData.sa.forEach(sa => {
                    activeSegmentIds.push(sa[0].toString());
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
             *
             * ris 2 seems to represent that the rism data shall be applied to the map while ris 1 only appears
             * after the robot complains about being unable to use the map
             *
             * With vSLAM robots, ris doesn't automatically switch from 1 to 2 after the initial cleanup.
             * Instead, it requires the start of another cleanup
             * Because of that, we also need to check for iscleanlog, so that a vSlam user gets to see their
             * newly mapped segments without any instantly aborted second cleanups.
             */
            if (additionalData.rism && (additionalData.ris === 2 || additionalData.iscleanlog === true)) {
                const rismResult = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(additionalData.rism), MAP_DATA_TYPES.RISM);

                if (rismResult instanceof mapEntities.ValetudoMap) {
                    rismResult.entities.forEach(e => {
                        if (e instanceof mapEntities.PointMapEntity) {
                            if (e.type === mapEntities.PointMapEntity.TYPE.ROBOT_POSITION && parsedHeader.robot_position.valid === false) {
                                entities.push(e);
                            }
                            if (e.type === mapEntities.PointMapEntity.TYPE.CHARGER_LOCATION && parsedHeader.charger_position.valid === false) {
                                entities.push(e);
                            }
                        } else if (e instanceof mapEntities.PolygonMapEntity) {
                            if (
                                e.type === mapEntities.PolygonMapEntity.TYPE.NO_GO_AREA ||
                                e.type === mapEntities.PolygonMapEntity.TYPE.NO_MOP_AREA
                            ) {
                                entities.push(e);
                            }
                        } else if (e instanceof mapEntities.LineMapEntity && e.type === mapEntities.LineMapEntity.TYPE.VIRTUAL_WALL) {
                            entities.push(e);
                        }
                    });

                    rismResult.layers.forEach(l => {
                        if (l.metaData.segmentId !== undefined) {
                            if (activeSegmentIds.includes(l.metaData.segmentId)) { //required for the 1C
                                l.metaData.active = true;
                            }

                            if (layers.findIndex(eL => {
                                return eL.metaData.segmentId === l.metaData.segmentId;
                            }) === -1) {
                                layers.push(l);
                            } else {
                                if (l.metaData.name) {
                                    layers.find(eL => {
                                        return eL.metaData.segmentId === l.metaData.segmentId;
                                    }).metaData.name = l.metaData.name;
                                }
                            }
                        } else {
                            if (layers.findIndex(eL => {
                                return eL.type === l.type;
                            }) === -1) {
                                layers.push(l);
                            }
                        }
                    });

                    if (rismResult.metaData?.dreamePendingMapChange !== undefined) {
                        metaData.dreamePendingMapChange = rismResult.metaData.dreamePendingMapChange;
                    }
                }
            }


            if (additionalData.tr) {
                const paths = DreameMapParser.PARSE_PATH(parsedHeader, additionalData.tr, additionalData.l2r === 1);

                if (paths?.length > 0) {
                    entities.push(...paths);
                }

            }

            if (Array.isArray(additionalData.da)) { //1C
                entities.push(
                    ...DreameMapParser.PARSE_AREAS(
                        parsedHeader,
                        [additionalData.da],
                        mapEntities.PolygonMapEntity.TYPE.ACTIVE_ZONE
                    )
                );
            }

            if (additionalData.da2 && Array.isArray(additionalData.da2.areas)) {
                entities.push(
                    ...DreameMapParser.PARSE_AREAS(
                        parsedHeader,
                        additionalData.da2.areas,
                        mapEntities.PolygonMapEntity.TYPE.ACTIVE_ZONE
                    )
                );
            }

            if (additionalData.vw) {
                if (Array.isArray(additionalData.vw.rect)) {
                    entities.push(
                        ...DreameMapParser.PARSE_AREAS(
                            parsedHeader,
                            additionalData.vw.rect,
                            mapEntities.PolygonMapEntity.TYPE.NO_GO_AREA
                        )
                    );
                }

                if (Array.isArray(additionalData.vw.mop)) {
                    entities.push(
                        ...DreameMapParser.PARSE_AREAS(
                            parsedHeader,
                            additionalData.vw.mop,
                            mapEntities.PolygonMapEntity.TYPE.NO_MOP_AREA
                        )
                    );
                }

                if (Array.isArray(additionalData.vw.line)) {
                    entities.push(
                        ...DreameMapParser.PARSE_LINES(
                            parsedHeader,
                            additionalData.vw.line,
                            mapEntities.LineMapEntity.TYPE.VIRTUAL_WALL
                        )
                    );
                }
            }

            /*
                TODO RESEARCH

                There can be an spoint object. No idea what that does
                There can also be multiple tpoint points. No idea when or why that happens or what it does either
             */
            if (additionalData.pointinfo && Array.isArray(additionalData.pointinfo.tpoint) && additionalData.pointinfo.tpoint.length === 1) {
                const goToPoint = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(
                    additionalData.pointinfo.tpoint[0][0],
                    additionalData.pointinfo.tpoint[0][1],
                );

                entities.push(new mapEntities.PointMapEntity({
                    points: [
                        goToPoint.x,
                        goToPoint.y,
                    ],
                    type: mapEntities.PointMapEntity.TYPE.GO_TO_TARGET
                }));
            }

            if (additionalData.suw > 0) {
                /*
                    6 = New Map in Single-map
                    5 = New Map in Multi-map

                    other values TBD
                 */
                metaData.dreamePendingMapChange = true;
            }

            if (additionalData.ai_obstacle?.length > 0) {
                additionalData.ai_obstacle.forEach((obstacle) => {
                    const coords = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(
                        parseFloat(obstacle[0]),
                        parseFloat(obstacle[1])
                    );
                    const type = DreameConst.AI_CLASSIFIER_IDS[obstacle[2]] ?? `Unknown ID ${obstacle[2]}`;
                    const confidence = `${Math.round(parseFloat(obstacle[3])*100)}%`;
                    const image = obstacle[5] !== undefined ? obstacle[5] : undefined;

                    if (HIDDEN_OBSTACLE_TYPES.includes(obstacle[2])) {
                        return;
                    }

                    entities.push(new mapEntities.PointMapEntity({
                        points: [
                            coords.x,
                            coords.y,
                        ],
                        type: mapEntities.PointMapEntity.TYPE.OBSTACLE,
                        metaData: {
                            label: `${type} (${confidence})`,
                            id: uuid.v5(
                                `${obstacle[2]}_${obstacle[0]}_${obstacle[1]}`,
                                OBSTACLE_ID_NAMESPACE
                            ),
                            image: image
                        }
                    }));
                });
            }
        } else {
            //Just a header
            return null;
        }

        // While the map is technically valid at this point, we still ignore it as we don't need a map with 0 pixels
        if (layers.length === 0) {
            return null;
        }

        return new mapEntities.ValetudoMap({
            metaData: metaData,
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

                        segments[segmentId].push(coords);
                    } else {
                        switch (px & 0b00000011) {
                            case PIXEL_TYPES.NONE:
                                break;
                            case PIXEL_TYPES.FLOOR:
                            case PIXEL_TYPES.CARPET:
                                floorPixels.push(coords);
                                break;
                            case PIXEL_TYPES.WALL:
                                wallPixels.push(coords);
                                break;
                            default:
                                Logger.warn("Unhandled pixel type", px);
                        }
                    }
                } else if (type === MAP_DATA_TYPES.RISM) {
                    /**
                     * A rism Pixel is one byte consisting of
                     *      1            1                000000
                     *      isWall flag  isCarpet flag    The Segment ID
                     */
                    const px = buf[(i * parsedHeader.width) + j];

                    const segmentId = px & 0b00111111;
                    const wallFlag = px >> 7;

                    /*
                        TODO: figure out what to do with the carpet information
                        px >> 6 & 0b00000001
                    */

                    if (wallFlag) {
                        wallPixels.push(coords);
                    } else if (segmentId > 0) {
                        if (!segments[segmentId]) {
                            segments[segmentId] = [];
                        }

                        segments[segmentId].push(coords);
                    }
                }
            }
        }

        if (floorPixels.length > 0) {
            layers.push(
                new mapEntities.MapLayer({
                    pixels: floorPixels.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.FLOOR
                })
            );
        }

        if (wallPixels.length > 0) {
            layers.push(
                new mapEntities.MapLayer({
                    pixels: wallPixels.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.WALL
                })
            );
        }

        Object.keys(segments).forEach(segmentId => {
            const metaData = {
                segmentId: segmentId,
                active: activeSegmentIds.includes(segmentId),
                source: type
            };

            if (segmentNames[segmentId]) {
                metaData.name = segmentNames[segmentId];
            }

            layers.push(
                new mapEntities.MapLayer({
                    pixels: segments[segmentId].sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.SEGMENT,
                    metaData: metaData
                })
            );
        });

        return layers;
    }

    static PARSE_PATH(parsedHeader, traceString, appendRobotPosition) {
        const paths = [];

        const unprocessedPaths = [];
        let currentUnprocessedPath = undefined;

        let currentPosition = {
            x: 0,
            y: 0
        };
        let match;

        while ((match = PATH_REGEX.exec(traceString)) !== null) {
            if (
                match.groups.operator === PATH_OPERATORS.START ||
                match.groups.operator === PATH_OPERATORS.MOP_START ||
                match.groups.operator === PATH_OPERATORS.DUAL_START
            ) {
                currentUnprocessedPath = [];
                unprocessedPaths.push(currentUnprocessedPath);

                currentPosition.x = parseInt(match.groups.x);
                currentPosition.y = parseInt(match.groups.y);
            } else if (match.groups.operator === PATH_OPERATORS.RELATIVE_LINE) {
                currentPosition.x += parseInt(match.groups.x);
                currentPosition.y += parseInt(match.groups.y);
            } else {
                throw new Error(`Invalid path operator ${match.groups.operator}`);
            }

            currentUnprocessedPath.push({
                x: currentPosition.x,
                y: currentPosition.y
            });
        }

        unprocessedPaths.forEach((unprocessedPoints, i) => {
            let processedPathPoints = [];

            unprocessedPoints.forEach(e => {
                const p = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(e.x, e.y);

                processedPathPoints.push(p.x, p.y);
            });

            //Add the robot position to the last of all paths
            if (i === unprocessedPaths.length-1 && appendRobotPosition) {
                processedPathPoints.push(parsedHeader.robot_position.x, parsedHeader.robot_position.y);
            }

            paths.push(
                new mapEntities.PathMapEntity({
                    points: processedPathPoints,
                    type: mapEntities.PathMapEntity.TYPE.PATH
                })
            );
        });


        return paths;
    }

    static PARSE_AREAS(parsedHeader, areas, type) {
        return areas.map(a => {
            const pA = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[0], a[1]);
            const pB = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[2], a[3]);

            //I'm way too lazy to figure out which dreame model uses which order of coordinates
            const xCoords = [pA.x, pB.x].sort((a, b) => {
                return a-b;
            });
            const yCoords = [pA.y, pB.y].sort((a, b) => {
                return a-b;
            });


            return new mapEntities.PolygonMapEntity({
                type: type,
                points: [
                    xCoords[0], yCoords[0],
                    xCoords[1], yCoords[0],
                    xCoords[1], yCoords[1],
                    xCoords[0], yCoords[1]
                ]
            });
        });
    }

    static PARSE_LINES(parsedHeader, lines, type) {
        return lines.map(a => {
            const pA = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[0], a[1]);
            const pB = DreameMapParser.CONVERT_TO_VALETUDO_COORDINATES(a[2], a[3]);


            return new mapEntities.LineMapEntity({
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
     *
     * @param {Buffer|string} data
     * @returns {Promise<Buffer|null>}
     */
    static async PREPROCESS(data) {
        // As string.toString() is a no-op, we don't need to check the type beforehand
        const base64String = data.toString().replace(/_/g, "/").replace(/-/g, "+");

        try {
            // intentional return await
            return await new Promise((resolve, reject) => {
                zlib.inflate(Buffer.from(base64String, "base64"), (err, result) => {
                    if (!err) {
                        resolve(result);
                    } else {
                        reject(err);
                    }
                });
            });
        } catch (e) {
            Logger.error("Error while preprocessing map", e);

            return null;
        }
    }
}

const PIXEL_TYPES = Object.freeze({
    NONE: 0,
    FLOOR: 1,
    WALL: 2,
    CARPET: 3
});

const FRAME_TYPES = Object.freeze({
    I: 73,
    P: 80
});

const PATH_REGEX = /(?<operator>[SMWL])(?<x>-?\d+),(?<y>-?\d+)/g;
const PATH_OPERATORS = {
    START: "S",
    MOP_START: "M",
    DUAL_START: "W",
    RELATIVE_LINE: "L"
};

/**
 *  @typedef {string} MapDataType
 *  @enum {string}
 *
 */
const MAP_DATA_TYPES = Object.freeze({
    REGULAR: "regular",
    RISM: "rism" //Room-information Saved Map
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

const HIDDEN_OBSTACLE_TYPES = ["200"];
const OBSTACLE_ID_NAMESPACE = "f90e13dc-3728-4267-bd90-43caa3f460e5";

module.exports = DreameMapParser;
