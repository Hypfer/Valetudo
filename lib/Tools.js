const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const MapFunctions = require("../client/js/MapFunctions");

const chargerImagePath = path.join(__dirname, '../client/img/charger.png');
const robotImagePath = path.join(__dirname, '../client/img/robot.png');
const CORRECT_PPM_MAP_FILE_SIZE = 3145745;
const CORRECT_GRID_MAP_FILE_SIZE = 1048576;
const ENCRYPTED_ARCHIVE_DATA_PASSWORD = Buffer.from("RoCKR0B0@BEIJING");

const Tools = {
    DIMENSION_PIXELS: 1024,
    DIMENSION_MM: 50 * 1024,

    MK_DIR_PATH: function (filepath) {
        var dirname = path.dirname(filepath);
        if (!fs.existsSync(dirname)) {
            Tools.MK_DIR_PATH(dirname);
        }
        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
        }
    },
    BUFFER_IS_GZIP: function (buf) {
        return Buffer.isBuffer(buf) && buf[0] === 0x1f && buf[1] === 0x8b;
    }
};

module.exports = Tools;