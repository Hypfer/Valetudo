const Logger = require("../../Logger");
const Map = require("../../entities/map");

/** @typedef {Array<number>} Pose */

/**
 * Experimental parser for the Viomi map binary format.
 * Many things are still TBD.
 *
 * This class expected an already inflated buffer
 * Sadly, this format doesn't feature magic bytes so there's no real way of sanity checking :(
 */
class ViomiMapParser {
    /** @param {Buffer} buf */
    constructor(buf) {
        this.buf = buf;
        this.offset = 0;
    }

    /**
     * Read n bytes from current offset. Advance offset.
     *
     * @param {number} n
     * @param {string} label Debug label
     * @returns {Buffer}
     */
    take(n, label) {
        const data = this.buf.slice(this.offset, this.offset + n);
        const different_length = n !== data.length ? " actual length: " + data.length : "";
        this.log("take " + n + "@" + label + different_length, data);
        this.offset += n;
        return data;
    }

    /**
     * Retrieves n bytes from current offsets without advancing
     *
     * @param {number} n
     * @returns {Buffer}
     */
    peek(n) {
        return this.buf.slice(this.offset, this.offset + n);
    }

    /**
     * @param {Buffer} buf
     * @param {number} offset
     * @returns {Array<number>} x,y-position in mm format
     */
    readFloatPosition(buf, offset) {
        // noinspection PointlessArithmeticExpressionJS
        const x = buf.readFloatLE(offset + 0);
        const y = buf.readFloatLE(offset + 4);
        if (x === ViomiMapParser.POSITION_UNKNOWN || y === ViomiMapParser.POSITION_UNKNOWN) {
            return;
        }
        return [
            ViomiMapParser.convertFloat(x),
            ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(y)
        ];
    }

    /*
    Some general notes on the structure of the file. Format: name = size
    bitmask = 4;
    MapId = 0x04;
    SCRobotStatus = 0x28;
    MapHead = 40; mask & 0x2
      BitmapData = 800 x 800; (actual size in MapHead)
    HistoryPose; mask & 0x4
      Head = 12
      HistoryPose = 9; * k
    ChargeStation = 16; mask & 0x8
    VirtualWall; mask & 0x10
      Head = 12
      VirtualWallOrArea = 92; * k
    AreaClean; mask & 0x20
      Head = 12
      VirtualWallOrArea = 92; * k
    NavigateTarget = 20; mask & 0x40
    RealtimePose = 21; mask & 0x80
    RouteHead = 16;
    CleanRecordInfo?...
    */
    /** Entrypoint for parsing. */
    parse() {
        /**
         * The first two bytes are a bitmask which states which features are present in the mapFile
         * The second two bytes are.. something?
         */
        const featureFlags = this.take(2, "featureFlags").readUInt16LE(0);
        this.take(2, "unknown01");

        this.mapId = asInts(this.take(0x4, "mapId"))[0];

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.ROBOT_STATUS) {
            this.robotStatus = this.take(0x28, "robot status");
        }


        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.MAP_IMAGE) {
            this.mapHead = this.take(0x28, "map head");
            this.parseImg();
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.PATH) {
            let head = asInts(this.take(12, "history"));
            this.history = [];
            for (let i = 0; i < head[2]; i++) {
                // Convert from ±meters to mm. UI assumes center is at 20m
                let position = this.readFloatPosition(this.buf, this.offset + 1);
                // first byte may be angle or whether robot is in taxi mode/cleaning
                //position.push(this.buf.readUInt8(this.offset)); //TODO
                this.history.push(position[0], position[1]);
                this.offset += 9;
            }
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.CHARGER_LOCATION) {
            // TODO: Figure out charge station location from this.
            let chargeStation = this.take(16, "charge station");
            this.chargeStation = {
                position: this.readFloatPosition(chargeStation, 4),
                orientation: chargeStation.readFloatLE(12)
            };
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.VIRTUAL_RESTRICTIONS) {
            let head = asInts(this.take(12, "virtual wall"));

            this.virtual_wall = [];
            this.no_go_area = [];

            let wall_num = head[2];

            for (let i = 0; i < wall_num; i++) {
                this.take(12, "virtual wall prefix");
                let body = asFloat(this.take(32, "Virtual walls coords"));

                if (body[0] === body[2] && body[1] === body[3] && body[4] === body[6] && body[5] === body[7]) {
                    //is wall
                    let x1 = Math.round(ViomiMapParser.convertFloat(body[0]));
                    let y1 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[1]));
                    let x2 = Math.round(ViomiMapParser.convertFloat(body[4]));
                    let y2 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[5]));

                    this.virtual_wall.push([x1, y1, x2, y2]);
                } else {
                    //is zone
                    let x1 = Math.round(ViomiMapParser.convertFloat(body[0]));
                    let y1 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[1]));
                    let x2 = Math.round(ViomiMapParser.convertFloat(body[2]));
                    let y2 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[3]));
                    let x3 = Math.round(ViomiMapParser.convertFloat(body[4]));
                    let y3 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[5]));
                    let x4 = Math.round(ViomiMapParser.convertFloat(body[6]));
                    let y4 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[7]));

                    this.no_go_area.push([x1, y1, x2, y2, x3, y3, x4, y4]);
                }

                this.take(48, "unknown48");
            }
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.ACTIVE_ZONES) {
            let head = asInts(this.take(12, "area head"));
            let area_num = head[2];

            this.clean_area = [];

            for (let i = 0; i < area_num; i++) {
                this.take(12, "area prefix");
                let body = asFloat(this.take(32, "area coords"));

                let x1 = Math.round(ViomiMapParser.convertFloat(body[0]));
                let y1 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[1]));
                let x2 = Math.round(ViomiMapParser.convertFloat(body[2]));
                let y2 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[3]));
                let x3 = Math.round(ViomiMapParser.convertFloat(body[4]));
                let y3 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[5]));
                let x4 = Math.round(ViomiMapParser.convertFloat(body[6]));
                let y4 = Math.round(ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(body[7]));

                this.clean_area.push([x1, y1, x2, y2, x3, y3, x4, y4]);

                this.take(48, "unknown48");
            }
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.GO_TO_TARGET) {
            let navigateTarget = this.take(20, "navigate");
            this.navigateTarget = {position: this.readFloatPosition(navigateTarget, 8)};
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.ROBOT_POSITION) {
            let realtimePose = this.take(21, "realtime");
            this.realtimePose = {
                position: this.readFloatPosition(realtimePose, 9),
                orientation: realtimePose.readFloatLE(13)
            };
        }

        if (featureFlags & ViomiMapParser.FEATURE_FLAGS.SEGMENTS) {
            //v6 example: 5b590f5f00000001
            //v7 example: e35a185e00000001
            this.take(8, "unknown8");
            this.parseRooms();

            if (this.mapId !== 0) {
                this.points = [];
                try {
                    this.parsePose();
                } catch (e) {
                    Logger.warn("Unable to parse Pose", e); //TODO
                }
            }
        }

        this.take(this.buf.length - this.offset, "trailing");

        // TODO: one of them is just the room outline, not actual past navigation logic
        return this.convertToValetudoMap({
            image: this.img,
            zones: this.rooms,
            //TODO: at least according to all my sample files, this.points is never the path
            //Why is this here?
            //path: {points: this.points.length ? this.points : this.history},
            path: {points: this.history},
            goto_target: this.navigateTarget && this.navigateTarget.position,
            robot: this.realtimePose && this.realtimePose.position,
            robot_angle: this.realtimePose?.orientation,
            charger: this.chargeStation && this.chargeStation.position,
            charger_angle: this.chargeStation?.orientation,
            virtual_wall: this.virtual_wall,
            no_go_area: this.no_go_area,
            clean_area: this.clean_area
        });
    }

    /**
     * Convert viomi angles to valetudo angles
     *
     * @private
     * @param {number} angle
     * @return {number}
     */
    viomiToValetudoAngle(angle) {
        let result = (-180 - (angle * 180 / Math.PI)) % 360;
        while (result < 0) {
            result += 360;
        }
        return result;
    }

    /**
     * This is a temporary conversion function which should at some point be replaced with a complete rewrite
     * of the viomi parser.
     *
     * For now however, this shall suffice
     *
     * @private
     * @param {object} mapContents
     * @param {object} [mapContents.image]
     * @param {object} [mapContents.zones]
     * @param {object} [mapContents.path]
     * @param {object} [mapContents.virtual_wall]
     * @param {object} [mapContents.no_go_area]
     * @param {object} [mapContents.clean_area]
     * @param {object} [mapContents.goto_target]
     * @param {object} [mapContents.robot]
     * @param {number} [mapContents.robot_angle]
     * @param {object} [mapContents.charger]
     * @param {number} [mapContents.charger_angle]
     */
    convertToValetudoMap(mapContents) {
        const layers = [];
        const entities = [];

        // The charger angle is usually always provided.
        // The robot angle may be 0, usually when the robot is docked.
        let chargerAngle = mapContents.charger_angle !== undefined ? this.viomiToValetudoAngle(mapContents.charger_angle) : 0;
        let robotAngle = (mapContents.robot_angle !== undefined && mapContents.robot_angle !== 0) ? this.viomiToValetudoAngle(mapContents.robot_angle) : chargerAngle;
        Logger.trace("Raw robot angle", mapContents.robot_angle, mapContents.robot_angle * 180 / Math.PI, "calculated", robotAngle);

        if (mapContents.image) {
            layers.push(new Map.MapLayer({
                pixels: mapContents.image.pixels.floor.sort(Map.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                type: Map.MapLayer.TYPE.FLOOR
            }));
            layers.push(new Map.MapLayer({
                pixels: mapContents.image.pixels.obstacle_strong.sort(Map.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                type: Map.MapLayer.TYPE.WALL
            }));

            if (mapContents.image.pixels.rooms && mapContents.zones) {
                Object.keys(mapContents.image.pixels.rooms).forEach(segmentId => {
                    // Ignore unnamed segments (they pollute the map).
                    if (!mapContents.zones[segmentId]) {
                        return;
                    }

                    layers.push(new Map.MapLayer({
                        pixels: mapContents.image.pixels.rooms[segmentId].sort(Map.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                        type: Map.MapLayer.TYPE.SEGMENT,
                        metaData: {
                            segmentId: segmentId,
                            active: false,
                            name: mapContents.zones[segmentId].name
                        }
                    }));
                });
            }
        }

        if (mapContents.path?.points?.length > 0) {
            entities.push(new Map.PathMapEntity({
                points: mapContents.path.points,
                type: Map.PathMapEntity.TYPE.PATH
            }));

            // Calculate robot angle from path if possible - the robot-reported angle is less accurate
            if (mapContents.path.points.length >= 4) {
                robotAngle = (Math.round(Math.atan2(
                    mapContents.path.points[mapContents.path.points.length - 1] -
                    mapContents.path.points[mapContents.path.points.length - 3],

                    mapContents.path.points[mapContents.path.points.length - 2] -
                    mapContents.path.points[mapContents.path.points.length - 4]
                ) * 180 / Math.PI) + 270) % 360; //TODO: No idea why
            }
        }

        if (mapContents.goto_target) {
            entities.push(new Map.PointMapEntity({
                points: mapContents.goto_target,
                type: Map.PointMapEntity.TYPE.GO_TO_TARGET
            }));
        }

        if (mapContents.robot) {
            entities.push(new Map.PointMapEntity({
                points: mapContents.robot,
                metaData: {
                    angle: robotAngle
                },
                type: Map.PointMapEntity.TYPE.ROBOT_POSITION
            }));
        }

        if (mapContents.charger) {
            entities.push(new Map.PointMapEntity({
                points: mapContents.charger,
                metaData: {
                    angle: chargerAngle
                },
                type: Map.PointMapEntity.TYPE.CHARGER_LOCATION
            }));
        }

        if (mapContents.virtual_wall) {
            mapContents.virtual_wall.forEach(wall => {
                entities.push(new Map.LineMapEntity({
                    points: wall,
                    type: Map.LineMapEntity.TYPE.VIRTUAL_WALL
                }));
            });
        }

        if (mapContents.no_go_area) {
            mapContents.no_go_area.forEach(area => {
                entities.push(new Map.PolygonMapEntity({
                    points: area,
                    type: Map.PolygonMapEntity.TYPE.NO_GO_AREA
                }));
            });

        }

        if (mapContents.clean_area) {
            mapContents.clean_area.forEach(area => {
                entities.push(new Map.PolygonMapEntity({
                    points: area,
                    type: Map.PolygonMapEntity.TYPE.ACTIVE_ZONE
                }));
            });

        }


        return new Map.ValetudoMap({
            metaData: {
                vendorMapId: this.mapId,
            },
            size: {
                x: 4000,
                y: 4000 //TODO?
            },
            pixelSize: 5,
            layers: layers,
            entities: entities
        });
    }

    /**
     * Debug log name and binary location.
     *
     * @param {string} name
     * @param {any=} extra
     */
    log(name, extra) {
        Logger.trace("fpos:" + (this.offset).toString(16), name, extra);
    }

    parsePose() {
        this.take(8 * 6, "unknown pose stuff");
        this.take(3, "unknown3");

        let length = this.take(4, "pose length").readUInt32LE(0);
        for (let i = 0; i < length; i++) {
            let roomId = this.buf.readUInt32LE(this.offset);
            this.log("room" + roomId);
            let elements = this.buf.readUInt32LE(this.offset + 4);
            this.offset += 8;
            let pose = this.points; // TODO: support per-room
            for (let j = 0; j < elements; j++) {
                pose.push(
                    ViomiMapParser.convertInt16(this.buf.readInt16LE(this.offset)),
                    ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertInt16(this.buf.readInt16LE(this.offset + 2))
                    //this.buf.readUInt8(this.offset + 4) //TODO
                );
                this.offset += 5;
            }
            this.rooms[roomId].outline = pose;
        }
    }

    /** Reads a string. 1 byte length, rest is string contents. */
    readString() {
        let len = this.buf.readUInt8(this.offset);
        let str = this.buf.toString("utf8", this.offset + 1, this.offset + 1 + len);
        this.offset += 1 + len;
        return str;
    }

    parseRooms() {
        this.take(4, "room header");
        let maps = {};
        /*
        Some examples:
        e3 5a 18 5e 00 01 00 00 00
        e3 5a 18 5e 00 00 00 00 00
        e3 5a 18 5e 03[41 6c 74]b4 d2 63 5e 07[5a 75 68 61 75 73 65]01 00 00 00> // 'Alt', 'Zuhause'
        e3 5a 18 5e 07[e5 9c b0 e5 9b be 31]01 00 00 00 '地图1'
         */
        let mapArg;

        do {
            let mapName = this.readString();
            mapArg = this.take(4, "mapArg:" + mapName).readUInt32LE(0);
            maps[mapName] = mapArg;
        } while (mapArg > 1);

        let length = this.take(4, "room length").readUInt32LE(0);

        /** @type {{[id: number]: {name: string, outline?: Pose[]}}} */
        let rooms = {};

        for (let i = 0; i < length; i++) {
            let nameLen = this.buf.readUInt8(this.offset + 1);
            let id = this.buf.readUInt8(this.offset);
            rooms[id] = {
                name: this.buf.toString("utf8", this.offset + 2, this.offset + 2 + nameLen)
            };
            this.log("room" + id + ": " + rooms[id].name, this.offset);
            this.offset += 3 + nameLen + 8;
        }

        this.rooms = rooms;
        this.take(6, "unknown");

        if (length) { // TODO: unclear what the condition is
            const rooms2header = this.take(8, "rooms2head");
            const rooms2length = this.take(4, "rooms2 length").readUInt32LE(0);

            for (let i = 0; i < rooms2length; i++) {
                this.take(92, "unknown room data");
            }

            const unkLength = this.take(4, "unk length").readUInt32LE(0);

            //RoomFlags looks like this:
            //0a010b010c010d010e01
            //Repeated for every room there is
            this.take(unkLength * 2, "room data");

            if (this.mapId === 0) {
                // Sometimes the map is truncated here, when that happens the second word is zeroes
                return;
            }

            // Hack - I wasn't able to understand this structure, it has a variable length that seems grow together with the
            // number of segments, but not linearly, exponentially or anything else.
            // This simply tries to eat up as many bytes until the start of the known tag value is found. Note that the tag
            // varies from vacuum to vacuum
            let takenBytes;
            let count = 0;
            do {
                takenBytes = this.peek(4);
                this.offset += 1;
                count += 1;
                if (count >= 300) {
                    throw new Error("Unable to seek to end of room data");
                }
            } while (Buffer.compare(takenBytes, rooms2header.slice(0, 4)) && this.offset < this.buf.length);

            this.take(3, "rest of tag");
        }
    }

    /**
     * Parses the map image. Pixel values map to either a room (id),
     * an obstacle, non-room area or are undefined (0).
     */
    parseImg() {
        const height = this.mapHead.readUInt32LE(12);
        const width = this.mapHead.readUInt32LE(16);
        let pixels = {
            floor: [],
            obstacle_strong: [],
            rooms: {}
        };
        if (height > 0 && width > 0) {
            for (let i = 0; i < height * width; i++) {
                const val = this.buf.readUInt8(this.offset++);
                let coords;
                if (val !== 0) {
                    coords = [i % width, height - 1 - Math.floor(i / width)];
                    switch (val) {
                        case 0:
                            // non-floor, do nothing
                            break;
                        case 255:
                            pixels.obstacle_strong.push([coords[0], coords[1]]);
                            break;
                        case 1: // non-room
                            pixels.floor.push([coords[0], coords[1]]);
                            break;
                        default:
                            if (!Array.isArray(pixels.rooms[val])) {
                                pixels.rooms[val] = [];
                            }

                            pixels.rooms[val].push([coords[0], coords[1]]);
                            pixels.floor.push([coords[0], coords[1]]);
                    }
                }
            }
        }
        this.img = {
            position: {
                top: 0,
                left: 0,
            },
            dimensions: {
                height: height,
                width: width,
            },
            pixels: pixels,
        };
    }

    /**
     * Converts a viomi location (meters relative to start of initial cleaning)
     * to Valetudo format (mm shifted by 20m).
     *
     * @param {number} value
     */
    static convertFloat(value) {
        return Math.ceil((20 + value) * 100);
    }

    /**
     * Converts a Valetudo location (mm shifted by 20m, upside-down) to Viomi position.
     *
     * @param {number} x
     * @param {number} y
     */
    static positionToViomi(x, y) {
        y = ViomiMapParser.MAX_MAP_HEIGHT - y;
        return {x: x / 100 - 20, y: y / 100 - 20};
    }

    /**
     * Converts a viomi location 1/20m relative to 20m to Valetudo format.
     *
     * @param {number} x
     */
    static convertInt16(x) { //TODO?
        return x * 5;
    }

    static convertInt16Position(x, y) {
        return {
            x: ViomiMapParser.convertFloat(x),
            y: ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(y)
        };
    }
}

/**
 * If buf.length is a multiple of 4, return an array of uint32 (little endian).
 *
 * @param {Buffer} buf
 * @returns {Array<number>}
 */
function asInts(buf) {
    let x = [];
    for (let i = 0; i < buf.length; i += 4) {
        x.push(buf.readUInt32LE(i));
    }
    return x;
}

/**
 * If buf.length is a multiple of 4, return an array of uint32 (little endian).
 *
 * @param {Buffer} buf
 * @returns {Array<number>}
 */
// eslint-disable-next-line no-unused-vars
function asFloat(buf) {
    let x = [];
    for (let i = 0; i < buf.length; i += 4) {
        x.push(buf.readFloatLE(i));
    }
    return x;
}

ViomiMapParser.MAX_MAP_HEIGHT = ViomiMapParser.convertFloat(20); // 4000

ViomiMapParser.POSITION_UNKNOWN = 1100;

ViomiMapParser.FEATURE_FLAGS = {
    ROBOT_STATUS:           0b000000000000001,
    MAP_IMAGE:              0b000000000000010,
    PATH:                   0b000000000000100,
    CHARGER_LOCATION:       0b000000000001000,
    VIRTUAL_RESTRICTIONS:   0b000000000010000,
    ACTIVE_ZONES:           0b000000000100000,
    GO_TO_TARGET:           0b000000001000000,
    ROBOT_POSITION:         0b000000010000000,
    //unknowns
    SEGMENTS:               0b000100000000000,
    //more unknowns
};


module.exports = ViomiMapParser;
