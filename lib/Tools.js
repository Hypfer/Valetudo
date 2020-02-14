const fs = require("fs");
const path = require("path");

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