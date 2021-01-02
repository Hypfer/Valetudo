const Map = require("./entities/map");
const Logger = require("./Logger");

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
     * @returns {null|import("./entities/map/ValetudoMap")}
     */
    static PARSE(buf) {
        //Maps are always at least 27 bytes in size
        if (!buf || buf.length < HEADER_SIZE) {
            return null;
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

        let layers;
        const entities = [
            new Map.PointMapEntity({
                points: [//Intentionally swapped x/y
                    Math.round(parsedHeader.robot_position.y - parsedHeader.top),
                    Math.round(parsedHeader.robot_position.x - parsedHeader.left)
                ],
                metaData: {
                    angle: (parsedHeader.robot_position.angle + 450) % 360
                },
                type: Map.PointMapEntity.TYPE.ROBOT_POSITION
            }),
            new Map.PointMapEntity({
                points: [ //Intentionally swapped x/y
                    Math.round(parsedHeader.charger_position.y - parsedHeader.top),
                    Math.round(parsedHeader.charger_position.x - parsedHeader.left)
                ],
                metaData: {
                    angle: (parsedHeader.charger_position.angle + 450) % 360
                },
                type: Map.PointMapEntity.TYPE.CHARGER_LOCATION
            })
        ];


        if (buf.length >= HEADER_SIZE + parsedHeader.width * parsedHeader.height) {
            const imageData = buf.slice(HEADER_SIZE, HEADER_SIZE + parsedHeader.width * parsedHeader.height);
            let additionalData = {};

            try {
                additionalData = JSON.parse(buf.slice(parsedHeader.width * parsedHeader.height + HEADER_SIZE).toString());
            } catch (e) {
                Logger.warn("Error while parsing additional map data", e);
            }

            if (additionalData.tr) {
                entities.push(
                    new Map.PathMapEntity({
                        points: DreameMapParser.PARSE_PATH(parsedHeader, additionalData.tr),
                        type: Map.PathMapEntity.TYPE.PATH
                    })
                );
            }

            layers = DreameMapParser.PARSE_IMAGE(parsedHeader, imageData);
        } else {
            //Just a header
            return null;
        }

        return new Map.ValetudoMap({
            size: {
                x: Math.round(((HALF_INT16 + HALF_INT16_UPPER_HALF)/10)),
                y: Math.round(((HALF_INT16 + HALF_INT16_UPPER_HALF)/10))
            },
            pixelSize: Math.round(parsedHeader.pixelSize /10),
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

        parsedHeader.robot_position.x = Math.round((buf.readInt16LE(5) + HALF_INT16)/10);
        parsedHeader.robot_position.y = Math.round((buf.readInt16LE(7) + HALF_INT16)/10);
        parsedHeader.robot_position.angle = buf.readInt16LE(9);

        parsedHeader.charger_position.x = Math.round((buf.readInt16LE(11) + HALF_INT16)/10);
        parsedHeader.charger_position.y = Math.round((buf.readInt16LE(13) + HALF_INT16)/10);
        parsedHeader.charger_position.angle = buf.readInt16LE(15);

        parsedHeader.pixelSize = buf.readInt16LE(17);

        parsedHeader.width = buf.readInt16LE(19);
        parsedHeader.height = buf.readInt16LE(21);

        parsedHeader.left = Math.round((buf.readInt16LE(23) + HALF_INT16 )/ 10);
        parsedHeader.top = Math.round((buf.readInt16LE(25) + HALF_INT16) / 10);

        return parsedHeader;
    }

    static PARSE_IMAGE(parsedHeader, buf) {
        const floorPixels = [];
        const wallPixels = [];
        const segments = {};

        const layers = [];

        for (let i = 0; i < parsedHeader.height; i++) {
            for (let j = 0; j < parsedHeader.width; j++) {
                const px = buf[(i * parsedHeader.width) + j];
                const coords = [i, j];

                const segmentId = px & 0x7f;

                if (segmentId > 2 && px !== PIXEL_TYPES.WALL_BUT_WITH_SEGMENTS) { //uuuuh
                    if (!segments[segmentId]) {
                        segments[segmentId] = [];
                    }

                    segments[segmentId].push(...coords);
                    floorPixels.push(...coords);


                } else {
                    switch (px) {
                        case PIXEL_TYPES.NONE:
                            break;
                        case PIXEL_TYPES.FLOOR:
                            floorPixels.push(...coords);
                            break;
                        case PIXEL_TYPES.WALL:
                        case PIXEL_TYPES.WALL_BUT_WITH_SEGMENTS:
                            wallPixels.push(...coords);
                            break;
                        default:
                            Logger.warn("Unhandled pixel type", px);
                    }
                }
            }
        }

        layers.push(
            new Map.MapLayer({
                pixels: floorPixels,
                type: Map.MapLayer.TYPE.FLOOR
            }),
            new Map.MapLayer({
                pixels: wallPixels,
                type: Map.MapLayer.TYPE.WALL
            }),
        );

        Object.keys(segments).forEach(segmentId => {
            layers.push(
                new Map.MapLayer({
                    pixels: segments[segmentId],
                    type: Map.MapLayer.TYPE.SEGMENT,
                    metaData: {
                        segmentId: segmentId
                    }
                })
            );
        });

        return layers;
    }


    static PARSE_PATH(parsedHeader, traceString) {
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
            path.push( //Not entirely sure why, but switching x and y seems to be required. oh well
                Math.round((e.y + HALF_INT16)/10) - parsedHeader.top,
                Math.round((e.x + HALF_INT16)/10) - parsedHeader.left
            );
        });


        return path;
    }
}

const PIXEL_TYPES = Object.freeze({
    NONE: 0,
    FLOOR: 1,
    WALL: 2,
    WALL_BUT_WITH_SEGMENTS: 254 //uuuuuuh what
});

const FRAME_TYPES = Object.freeze({
    I: 73,
    P: 80
});

const HALF_INT16 = 32768;
const HALF_INT16_UPPER_HALF = 32767;
const HEADER_SIZE = 27;

module.exports = DreameMapParser;
