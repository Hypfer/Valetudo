const Logger = require("./Logger");

/**
 * Experimental parser for the Viomi map binary format.
 * Many things are still TBD.
 * @param {Buffer} buf
 * @constructor
 */
const ViomiMapParser = function(buf) {
    this.buf = buf;
    this.offset = 0;
};

/**
 * Read n bytes from current offset. Advance offset.
 * @param {number} n
 * @param {string} label Debug label
 * @returns {Buffer}
 */
ViomiMapParser.prototype.take = function(n, label) {
    let data = this.buf.slice(this.offset, this.offset + n);
    this.log("take " + n + "@" + label, data);
    this.offset += n;
    return data;
};

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

/**
 * Converts a viomi location (meters relative to start of initial cleaning)
 * to Valetudo format (mm shifted by 20m).
 */
ViomiMapParser.convertFloat = function(x) {
    return Math.ceil((20 + x) * 1000);
};

/** Converts a viomi location 1/20m relative to 20m to Valetudo format. */
ViomiMapParser.convertInt16 = function(x) {
    return x * 50;
};

ViomiMapParser.MAX_MAP_HEIGHT = ViomiMapParser.convertFloat(20); // 40000

ViomiMapParser.POSITION_UNKNOWN = 1100;

/**
 * @param buf {Buffer}
 * @param offset {number}
 * @return {Array<number>} x,y-position in mm format
 */
ViomiMapParser.prototype.readFloatPosition = function(buf, offset) {
    const x = buf.readFloatLE(offset + 0);
    const y = buf.readFloatLE(offset + 4);
    if (x == ViomiMapParser.POSITION_UNKNOWN || y == ViomiMapParser.POSITION_UNKNOWN) {
        return;
    }
    return [
        ViomiMapParser.convertFloat(x),
        ViomiMapParser.MAX_MAP_HEIGHT - ViomiMapParser.convertFloat(y)
    ];
};

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
ViomiMapParser.prototype.parse = function() {
    let historyMask = this.take(4, "mask").readUInt16LE(0);

    // probably always present regardless of mask
    this.robotStatus = this.take(0x2C, "robot status");

    if (historyMask & 2) {
        this.mapHead = this.take(0x28, "map head");
        this.parseImg();
    }

    if (historyMask & 4) {
        let head = asInts(this.take(12, "history"));
        this.history = [];
        for (let i = 0; i < head[2]; i++) {
            // Convert from ±meters to mm. UI assumes center is at 20m
            let position = this.readFloatPosition(this.buf, this.offset + 1);
            // first byte may be angle or whether robot is in taxi mode/cleaning
            position.push(this.buf.readUInt8(this.offset));
            this.history.push(position);
            this.offset += 9;
        }
    }

    if (historyMask & 8) {
        // TODO: Figure out charge station location from this.
        let chargeStation = this.take(16, "charge station");
        this.chargeStation = {
            position: this.readFloatPosition(chargeStation, 4),
            orientation: chargeStation.readFloatLE(12)
        };
    }

    if (historyMask & 0x10) {
        let head = asInts(this.take(12, "virtual wall"));
        Logger.trace("VirtualWall", head);
        this.take(92 * head[2], "virtual wall content");
    }

    if (historyMask & 0x20) {
        let head = asInts(this.take(12, "area head"));
        Logger.trace("AreaClean", head);
        this.take(92 * head[2], "area content");
    }

    if (historyMask & 0x40) {
        let navigateTarget = this.take(20, "navigate");
        this.navigateTarget = {position: this.readFloatPosition(navigateTarget, 8)};
    }

    if (historyMask & 0x80) {
        let realtimePose = this.take(21, "realtime");
        this.realtimePose = {position: this.readFloatPosition(realtimePose, 9)};
    }

    this.take(8, "unknown8");

    this.parseRooms();

    // more stuff i don't understand
    this.take(50, "unknown50");
    this.take(5, "unknown5");

    this.points = [];
    this.parsePose();

    this.log("end", "remaining: " + (this.buf.length - this.offset));

    // TODO: one of them is just the room outline, not actual past navigation logic
    return {
        image: this.img,
        path: {points: this.points.length ? this.points : this.history},
        goto_target: this.navigateTarget.position,
        robot: this.realtimePose.position,
        charger: this.chargeStation.position
    };
};

/** Debug log name and binary location. */
ViomiMapParser.prototype.log = function(name, extra) {
    Logger.trace(name, (this.offset).toString(16), extra);
};

ViomiMapParser.prototype.parsePose = function() {
    let length = this.take(4, "pose length").readUInt32LE(0);
    for (let i = 0; i < length; i++) {
        let roomId = this.buf.readUInt32LE(this.offset);
        this.log("room" + roomId);

        let elements = this.buf.readUInt32LE(this.offset + 4);
        this.offset += 8;
        let pose = this.points; // TODO: support per-room
        for (let j = 0; j < elements; j++) {
            pose.push([
                ViomiMapParser.convertInt16(this.buf.readInt16LE(this.offset)),
                ViomiMapParser.MAX_MAP_HEIGHT -
                    ViomiMapParser.convertInt16(this.buf.readInt16LE(this.offset + 2)),
                this.buf.readUInt8(this.offset + 4)
            ]);
            this.offset += 5;
        }
        this.rooms[roomId].pose = pose;
    }
};


/** Reads a string. 1 byte length, rest is string contents. */
ViomiMapParser.prototype.readString = function() {
    let len = this.buf.readUInt8(this.offset);
    let str = this.buf.toString("utf8", this.offset + 1, this.offset + 1 + len);
    this.offset += 1 + len;
    return str;
};

ViomiMapParser.prototype.parseRooms = function() {
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
        this.take([45, 21, 12][x], "unknown");
    }
};

ViomiMapParser.prototype.parseImg = function() {
    var height = this.mapHead.readUInt32LE(12);
    var width = this.mapHead.readUInt32LE(16);
    let pixels = {
        floor: [],
        obstacle_strong: [],
        // rooms: {},  // TODO: include per-room data again.
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
                        pixels.obstacle_strong.push(coords);
                        break;
                    case 1: // non-room
                        pixels.floor.push(coords);
                        break;
                    default:
                        // val is the room id.
                        // if (!(val in pixels.rooms)) pixels.rooms[val] = [];
                        // pixels.rooms[val].push(coords);
                        pixels.floor.push(coords);
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
};

module.exports = ViomiMapParser;
