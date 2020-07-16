const Logger = require("./Logger");
const Map = require("./entities/map");

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
     * @param {number} n
     * @param {string} label Debug label
     * @returns {Buffer}
     */
    take(n, label) {
        let data = this.buf.slice(this.offset, this.offset + n);
        this.log("take " + n + "@" + label, data);
        this.offset += n;
        return data;
    }

    /**
     * @param buf {Buffer}
     * @param offset {number}
     * @return {Array<number>} x,y-position in mm format
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
    SCRobotStatus = 0x2C;
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
        // probably always present regardless of mask
        this.robotStatus = this.take(0x2C, "robot status");


        if (featureFlags & 0b000000000000010) {
            this.mapHead = this.take(0x28, "map head");
            this.parseImg();
        }
        if (featureFlags & 0b000000000000100) {
            let head = asInts(this.take(12, "history"));
            this.history = [];
            for (let i = 0; i < head[2]; i++) {
                // Convert from ±meters to mm. UI assumes center is at 20m
                let position = this.readFloatPosition(this.buf, this.offset + 1);
                // first byte may be angle or whether robot is in taxi mode/cleaning
                //position.push(this.buf.readUInt8(this.offset)); //TODO
                this.history.push(position);
                this.offset += 9;
            }
        }
        if (featureFlags & 0b000000000001000) {
            // TODO: Figure out charge station location from this.
            let chargeStation = this.take(16, "charge station");
            this.chargeStation = {
                position: this.readFloatPosition(chargeStation, 4),
                orientation: chargeStation.readFloatLE(12)
            };
        }
        if (featureFlags & 0b000000000010000) {
            let head = asInts(this.take(12, "virtual wall"));
            Logger.trace("VirtualWall", head);
            this.take(92 * head[2], "virtual wall content");
        }
        if (featureFlags & 0b000000000100000) {
            let head = asInts(this.take(12, "area head"));
            Logger.trace("AreaClean", head);
            this.take(92 * head[2], "area content");
        }
        if (featureFlags & 0b000000001000000) {
            let navigateTarget = this.take(20, "navigate");
            this.navigateTarget = {position: this.readFloatPosition(navigateTarget, 8)};
        }
        if (featureFlags & 0b000000010000000) {
            let realtimePose = this.take(21, "realtime");
            this.realtimePose = {position: this.readFloatPosition(realtimePose, 9)};
        }
        this.take(8, "unknown8");
        this.parseRooms();
        // more stuff i don't understand
        this.take(50, "unknown50");
        this.take(5, "unknown5");
        this.points = [];
        try {
            this.parsePose();
        } catch (e) {
            Logger.warn("Unable to parse Pose", e); //TODO
        }

        this.log("end", "remaining: " + (this.buf.length - this.offset));
        // TODO: one of them is just the room outline, not actual past navigation logic
        return this.convertToValetudoMap({
            image: this.img,
            zones: this.rooms, //TODO
            path: {points: this.points.length ? this.points : this.history},
            goto_target: this.navigateTarget.position,
            robot: this.realtimePose.position,
            charger: this.chargeStation.position
        });
    }

    /**
     * This is a temporary conversion function which should at some point be replaced with a complete rewrite
     * of the viomi parser.
     *
     * For now however, this shall suffice
     *
     * @private
     * @param mapContents {object}
     * @param [mapContents.image] {object}
     * @param [mapContents.zones]
     * @param [mapContents.path]
     * @param [mapContents.goto_target]
     * @param [mapContents.robot]
     * @param [mapContents.charger]
     */
    convertToValetudoMap(mapContents) {
        const layers = [];
        const entities = [];

        if (mapContents.image) {
            layers.push(new Map.MapLayer({
                pixels: mapContents.image.pixels.floor,
                type: Map.MapLayer.TYPE.FLOOR
            }));
            layers.push(new Map.MapLayer({
                pixels: mapContents.image.pixels.obstacle_strong,
                type: Map.MapLayer.TYPE.WALL
            }));

            if (mapContents.image.pixels.rooms) {
                Object.keys(mapContents.image.pixels.rooms).forEach(k => {
                    const segmentId = parseInt(k);

                    layers.push(new Map.MapLayer({
                        pixels: mapContents.image.pixels.rooms[k],
                        type: Map.MapLayer.TYPE.SEGMENT,
                        metaData: {
                            segmentId: segmentId,
                            active: false
                        }
                    }));
                });
            }
        }

        if (mapContents.path) {
            entities.push(new Map.PathMapEntity({
                points: mapContents.path.points,
                type: Map.PathMapEntity.TYPE.PATH
            }));
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
                    angle: 0 //TODO
                },
                type: Map.PointMapEntity.TYPE.ROBOT_POSITION
            }));
        }

        if (mapContents.charger) {
            entities.push(new Map.PointMapEntity({
                points: mapContents.charger,
                type: Map.PointMapEntity.TYPE.CHARGER_LOCATION
            }));
        }

        return new Map.ValetudoMap({
            size: {
                x: 4000,
                y: 4000 //TODO?
            },
            pixelSize: 5,
            layers: layers,
            entities: entities
        });
    }

    /** Debug log name and binary location. */
    log(name, extra) {
        Logger.trace(name, (this.offset).toString(16), extra);
    }

    parsePose() {
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
        /** @type {Object<number, {name: string, outline?: Array<Pose>}>} */
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
            this.take(12, "rooms2head");
            length = this.take(4, "rooms2 length").readUInt32LE(0);
            this.take(length * 2, "room data");
            let x = this.take(4, "unknown2").readUInt32BE(0); // big endian!!!

            let index = [45, 21, 12][x];

            if (index) {
                this.take([45, 21, 12][x], "unknown");
            } else {
                //TODO!
            }
        }
    }

    /**
     * Parses the map image. Pixel values map to either a room (id),
     * an obstacle, non-room area or are undefined (0).
     */
    parseImg() {
        var height = this.mapHead.readUInt32LE(12);
        var width = this.mapHead.readUInt32LE(16);
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
                            pixels.obstacle_strong.push(coords[0], coords[1]);
                            break;
                        case 1: // non-room
                            pixels.floor.push(coords[0], coords[1]);
                            break;
                        default:
                            if (!Array.isArray(pixels.rooms[val])) {
                                pixels.rooms[val] = [];
                            }

                            pixels.rooms[val].push(coords[0], coords[1]);
                            pixels.floor.push(coords[0], coords[1]);
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
     */
    static convertFloat(value) {
        return Math.ceil((20 + value) * 100);
    }

    /**
     * Converts a Valetudo location (mm shifted by 20m, upside-down) to Viomi position.
     */
    static positionToViomi(x, y) {
        y = ViomiMapParser.MAX_MAP_HEIGHT - y;
        return {x: x / 100 - 20, y: y / 100 - 20};
    }

    /** Converts a viomi location 1/20m relative to 20m to Valetudo format. */
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
 * @param {Buffer} buf
 * @returns {Array<number>}
 */
function asInts(buf) {
    let x = [];
    for (let i = 0; i < buf.length; i += 4)
        x.push(buf.readUInt32LE(i));
    return x;
}

/**
 * If buf.length is a multiple of 4, return an array of uint32 (little endian).
 * @param {Buffer} buf
 * @returns {Array<number>}
 */
// eslint-disable-next-line no-unused-vars
function asFloat(buf) {
    let x = [];
    for (let i = 0; i < buf.length; i += 4)
        x.push(buf.readFloatLE(i));
    return x;
}

ViomiMapParser.MAX_MAP_HEIGHT = ViomiMapParser.convertFloat(20); // 4000

ViomiMapParser.POSITION_UNKNOWN = 1100;









module.exports = ViomiMapParser;
