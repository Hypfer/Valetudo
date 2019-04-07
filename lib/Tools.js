const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
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
    },
    /**
     *
     * @param options {object}
     * @param options.mapDTO {MapDTO}
     * @param options.settings
     * @param callback {function}
     * @constructor
     */
    DRAW_MAP_PNG: function (options, callback) {
        const COLORS = {
            floor: Jimp.rgbaToInt(0, 118, 255, 255),
            obstacle_weak: Jimp.rgbaToInt(102, 153, 255, 255),
            obstacle_strong: Jimp.rgbaToInt(82, 174, 255, 255),
            path: Jimp.rgbaToInt(255, 255, 255, 255)
        };
        const DIMENSIONS = {
            width: options.mapDTO.parsedData.image.dimensions.width,
            height: options.mapDTO.parsedData.image.dimensions.height
        };

        const settings = Object.assign({
            drawPath: true,
            drawCharger: true,
            drawRobot: true,
            border: 2,
            scale: 4
        }, options.settings);

        new Jimp(DIMENSIONS.width, DIMENSIONS.height, function (err, image) {
            if (!err) {
                //Step 1: Draw Map + calculate viewport
                Object.keys(options.mapDTO.parsedData.image.pixels).forEach(key => {
                    const color = COLORS[key];

                    options.mapDTO.parsedData.image.pixels[key].forEach(function drawPixel(px) {
                        image.setPixelColor(color, px[0], px[1]);
                    })
                });

                //Step 2: Scale
                image.scale(settings.scale, Jimp.RESIZE_NEAREST_NEIGHBOR);

                //Step 3: Draw Path
                const coords = options.mapDTO.parsedData.path.points.map(point => {
                    return [
                        Math.floor((point[0]/50 - options.mapDTO.parsedData.image.position.left) * settings.scale),
                        Math.floor((point[1]/50 - options.mapDTO.parsedData.image.position.top) * settings.scale)
                    ]});
                let first = true;
                let oldPathX, oldPathY; // old Coordinates
                let dx, dy; //delta x and y
                let step, x, y, i;
                coords.forEach(function (coord) {
                    if (!first && settings.drawPath) {
                        dx = (coord[0] - oldPathX);
                        dy = (coord[1] - oldPathY);
                        if (Math.abs(dx) >= Math.abs(dy)) {
                            step = Math.abs(dx);
                        } else {
                            step = Math.abs(dy);
                        }
                        dx = dx / step;
                        dy = dy / step;
                        x = oldPathX;
                        y = oldPathY;
                        i = 1;
                        while (i <= step) {
                            image.setPixelColor(COLORS.path, x, y);
                            x = x + dx;
                            y = y + dy;
                            i = i + 1;
                        }
                    }
                    oldPathX = coord[0];
                    oldPathY = coord[1];
                    first = false;
                });

                Jimp.read(chargerImagePath, function (err, chargerImage) {
                    if (!err) {
                        Jimp.read(robotImagePath, function (err, robotImage) {
                            if (!err) {
                                //Step 6: Draw Charger
                                if (settings.drawCharger === true && options.mapDTO.parsedData.charger) {
                                    const chargerCoords = {
                                        x: options.mapDTO.parsedData.charger[0] / 50 - options.mapDTO.parsedData.image.position.left,
                                        y: options.mapDTO.parsedData.charger[1] / 50 - options.mapDTO.parsedData.image.position.top
                                    };

                                    image.composite(
                                        chargerImage,
                                        chargerCoords.x * settings.scale - chargerImage.bitmap.width / 2,
                                        chargerCoords.y * settings.scale - chargerImage.bitmap.height / 2
                                    );
                                }

                                //Step 7: Draw Robot
                                if (settings.drawRobot === true && options.mapDTO.parsedData.robot) {
                                    const robotCoords = {
                                        x: options.mapDTO.parsedData.robot[0] / 50 - options.mapDTO.parsedData.image.position.left,
                                        y: options.mapDTO.parsedData.robot[1] / 50 - options.mapDTO.parsedData.image.position.top
                                    };

                                    image.composite(
                                        robotImage.rotate(-1 * options.mapDTO.parsedData.path.current_angle),
                                        robotCoords.x * settings.scale - robotImage.bitmap.width / 2,
                                        robotCoords.y * settings.scale - robotImage.bitmap.height / 2
                                    )
                                }

                                image.getBuffer(Jimp.AUTO, callback);
                            } else {
                                callback(err);
                            }
                        })
                    } else {
                        callback(err);
                    }
                });
            } else {
                callback(err);
            }
        });
    }
};

module.exports = Tools;