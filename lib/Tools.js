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
     * @param options.mapData
     * @param options.log
     * @param options.settings
     * @param callback {function}
     * @constructor
     */
    DRAW_MAP_PNG: function (options, callback) {
        const COLORS = {
            free: Jimp.rgbaToInt(0, 118, 255, 255),
            obstacle_weak: Jimp.rgbaToInt(102, 153, 255, 255),
            obstacle_strong: Jimp.rgbaToInt(82, 174, 255, 255),
            path: Jimp.rgbaToInt(255, 255, 255, 255)
        };
        const DIMENSIONS = {
            width: 1024,
            height: 1024
        };

        const settings = Object.assign({
            drawPath: true,
            drawCharger: true,
            drawRobot: true,
            border: 2,
            doCropping: true,
            scale: 4
        }, options.settings);


        const viewport = {
            x: {
                min: DIMENSIONS.width,
                max: 0,
                offset: 0
            },
            y: {
                min: DIMENSIONS.height,
                max: 0,
                offset: 0
            }
        };

        new Jimp(DIMENSIONS.width, DIMENSIONS.height, function (err, image) {
            if (!err) {
                //Step 1: Draw Map + calculate viewport
                options.mapData.map.forEach(function drawPixelAndKeepTrackOfViewport(px) {
                    let color;
                    const coordinates = {};

                    //This maps the ppm pixel index to its respective x/y value
                    coordinates.y = Math.floor(px[0] / (DIMENSIONS.height * 4));
                    coordinates.x = ((px[0] - coordinates.y * (DIMENSIONS.width * 4)) / 4);


                    //Update Viewport so we can crop later
                    if (coordinates.x > viewport.x.max) {
                        viewport.x.max = coordinates.x;
                    } else if (coordinates.x < viewport.x.min) {
                        viewport.x.min = coordinates.x;
                    }

                    if (coordinates.y > viewport.y.max) {
                        viewport.y.max = coordinates.y;
                    } else if (coordinates.y < viewport.y.min) {
                        viewport.y.min = coordinates.y;
                    }

                    if (px[1] === 0 && px[2] === 0 && px[3] === 0) {
                        color = COLORS.obstacle_strong;
                    } else if (px[1] === 255 && px[2] === 255 && px[3] === 255) {
                        color = COLORS.free;
                    } else {
                        color = COLORS.obstacle_weak;
                    }

                    image.setPixelColor(color, coordinates.x, coordinates.y);
                });

                //Step 2: Crop
                if (settings.doCropping === true) {
                    const crop = {};
                    viewport.x.offset = viewport.x.min - settings.border;
                    viewport.y.offset = viewport.y.min - settings.border;


                    crop.w = viewport.x.max - viewport.x.min + 2 * settings.border;
                    crop.h = viewport.y.max - viewport.y.min + 2 * settings.border;


                    if(crop.w < 1 || crop.h < 1) {
                        console.error("Invalid Crop!");
                        console.error(viewport, crop)
                    } else {
                        image.crop(
                            viewport.x.offset,
                            viewport.y.offset,
                            crop.w,
                            crop.h
                        );
                    }
                }

                //Step 3: Scale
                image.scale(settings.scale, Jimp.RESIZE_NEAREST_NEIGHBOR);

                //Step 4: Analyze Path
                const lines = options.log.split("\n");

                let coords = [];
                var startLine = 0;

                if (settings.drawPath === false && lines.length > 10) {
                    //reduce unnecessary calculation time if path is not drawn
                    startLine = lines.length - 10;
                }

                for (let lc = startLine, len = lines.length; lc < len; lc++) {
                    const line = lines[lc];
                    if (line.indexOf("reset") !== -1) {
                        coords = [];
                    }
                    if (line.indexOf("estimate") !== -1) {
                        let splitLine = line.split(" ");
                        let x = (DIMENSIONS.width / 2) + (splitLine[2] * 20);
                        let y = splitLine[3] * 20;
                        if (options.mapData.yFlipped) {
                            y = y * -1;
                        }
                        //move coordinates to match cropped viewport
                        x -= viewport.x.offset;
                        y -= viewport.y.offset;
                        coords.push([
                            Math.round(x * settings.scale),
                            Math.round(((DIMENSIONS.width / 2) + y) * settings.scale)
                        ]);
                    }
                }

                //Step 5: Draw Path
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
                // noinspection JSUnusedAssignment
                const robotPosition = {
                    x: oldPathX,
                    y: oldPathY,
                    known: oldPathX !== undefined && oldPathY !== undefined
                };

                var robotAngle = 0;
                if (coords.length > 2) {
                    //the image has the offset of 90 degrees (top = 0 deg)
                    robotAngle = 90 + Math.atan2(coords[coords.length - 1][1] - coords[coords.length - 2][1], coords[coords.length - 1][0] - coords[coords.length - 2][0]) * 180 / Math.PI;
                }

                Jimp.read(chargerImagePath, function (err, chargerImage) {
                    if (!err) {
                        Jimp.read(robotImagePath, function (err, robotImage) {
                            if (!err) {
                                //Step 6: Draw Charger
                                if (settings.drawCharger === true) {
                                    image.composite(
                                        chargerImage,
                                        (((DIMENSIONS.width / 2) - viewport.x.offset) * settings.scale) - chargerImage.bitmap.width / 2,
                                        (((DIMENSIONS.height / 2) - viewport.y.offset) * settings.scale) - chargerImage.bitmap.height / 2
                                    );
                                }

                                //Step 7: Draw Robot
                                if (settings.drawRobot === true && robotPosition.known === true) {
                                    image.composite(
                                        robotImage.rotate(-1 * robotAngle),
                                        robotPosition.x - robotImage.bitmap.width / 2,
                                        robotPosition.y - robotImage.bitmap.height / 2
                                    )
                                }

                                image.getBuffer(Jimp.AUTO, callback)
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
    },
    GENERATE_TEST_MAP: function () {
        const mapData = [];
        for (let y = 0; y < 1024; y++) {
            for (let x = 0; x < 1024; x++) {
                let index = 4 * (y * 1024 + x);

                // 4x4m square
                if (x >= 472 && x <= 552 && y >= 472 && y <= 552) {
                    if (x === 472 || x === 552 || y === 472 || y === 552) {
                        mapData.push([index, 0, 0, 0]);
                    } else {
                        mapData.push([index, 255, 255, 255]);
                    }
                }
            }
        }
        return {map: mapData, yFlipped: false};
    },
    GENERATE_TEST_PATH: function () {
        const lines = [
            // 3
            "estimate 0 -1.5 -0.5",
            "estimate 0 -1 -0.5",
            "estimate 0 -1 0",
            "estimate 0 -1.5 0",
            "estimate 0 -1 0",
            "estimate 0 -1 0.5",
            "estimate 0 -1.5 0.5",
            // 5
            "estimate 0 -0.75 -0.5",
            "estimate 0 -0.25 -0.5",
            "estimate 0 -0.75 -0.5",
            "estimate 0 -0.75 0",
            "estimate 0 -0.25 0",
            "estimate 0 -0.25 0.5",
            "estimate 0 -0.75 0.5",
            // C
            "estimate 0 0 -0.5",
            "estimate 0 0.5 -0.5",
            "estimate 0 0 -0.5",
            "estimate 0 0 0.5",
            "estimate 0 0.5 0.5",
            // 3
            "estimate 0 0.75 -0.5",
            "estimate 0 1.25 -0.5",
            "estimate 0 1.25 0",
            "estimate 0 0.75 0",
            "estimate 0 1.25 0",
            "estimate 0 1.25 0.5",
            "estimate 0 0.75 0.5"
        ];
        // noinspection JSConstructorReturnsPrimitive
        return lines.join("\n");
    },
    FIND_LATEST_MAP: function (callback) {
        if (process.env.VAC_MAP_TEST) {
            callback(null, {
                mapData: Tools.GENERATE_TEST_MAP(),
                log: Tools.GENERATE_TEST_PATH()
            })
        } else {
            Tools.FIND_LATEST_MAP_IN_RAMDISK(callback);
        }
    },
    FIND_LATEST_MAP_IN_RAMDISK: function (callback) {
        fs.readdir("/dev/shm", function (err, filenames) {
            if (err) {
                callback(err);
            } else {
                let mapFileName;
                let logFileName;

                filenames.forEach(function (filename) {
                    if (filename.endsWith(".ppm")) {
                        mapFileName = filename;
                    }
                    if (filename === "SLAM_fprintf.log") {
                        logFileName = filename;
                    }
                });

                if (mapFileName && logFileName) {
                    fs.readFile(path.join("/dev/shm", logFileName), function (err, file) {
                        if (err) {
                            callback(err);
                        } else {
                            const log = file.toString();
                            if (log.indexOf("estimate") !== -1) {
                                const mapPath = path.join("/dev/shm", mapFileName);

                                fs.readFile(mapPath, function (err, file) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        if (file.length !== CORRECT_PPM_MAP_FILE_SIZE) {
                                            let tries = 0;
                                            let newFile = new Buffer.alloc(0);

                                            //I'm 1000% sure that there is a better way to fix incompletely written map files
                                            //But since its a ramdisk I guess this hack shouldn't matter that much
                                            //Maybe someday I'll implement a better solution. Not today though
                                            while (newFile.length !== CORRECT_PPM_MAP_FILE_SIZE && tries <= 250) {
                                                tries++;
                                                newFile = fs.readFileSync(mapPath);
                                            }

                                            if (newFile.length === CORRECT_PPM_MAP_FILE_SIZE) {
                                                callback(null, {
                                                    mapData: Tools.PARSE_PPM_MAP(newFile),
                                                    log: log
                                                })
                                            } else {
                                                fs.readFile("/dev/shm/GridMap", function (err, gridMapFile) {
                                                    if (err) {
                                                        callback(new Error("Unable to get complete map file"))
                                                    } else {
                                                        callback(null, {
                                                            mapData: Tools.PARSE_GRID_MAP(gridMapFile),
                                                            log: log
                                                        })
                                                    }
                                                })
                                            }
                                        } else {
                                            callback(null, {
                                                mapData: Tools.PARSE_PPM_MAP(file),
                                                log: log
                                            })
                                        }
                                    }
                                })
                            } else {
                                Tools.FIND_LATEST_MAP_IN_ARCHIVE(callback)
                            }
                        }
                    })
                } else {
                    Tools.FIND_LATEST_MAP_IN_ARCHIVE(callback)
                }
            }
        })
    },
    FIND_LATEST_MAP_IN_ARCHIVE: function (callback) {
        fs.readdir("/mnt/data/rockrobo/rrlog", function (err, filenames) {
            if (err) {
                callback(err);
            } else {
                let folders = [];

                filenames.forEach(function (filename) {
                    if (/^([0-9]{6})\.([0-9]{17})_(R([0-9]{4})S([0-9]{8})|[0-9]{13})_([0-9]{10})REL$/.test(filename)) {
                        folders.push(filename);
                    }
                });
                folders = folders.sort().reverse();

                let newestUsableFolderName;
                let mapFileName;
                let logFileName;

                for (let i in folders) {
                    const folder = folders[i];
                    try {
                        const folderContents = fs.readdirSync(path.join("/mnt/data/rockrobo/rrlog", folder));
                        let possibleMapFileNames = [];
                        mapFileName = undefined;
                        logFileName = undefined;


                        folderContents.forEach(function (filename) {
                            if (/^navmap([0-9]+)\.ppm\.([0-9]{4})(\.rr)?\.gz$/.test(filename)) {
                                possibleMapFileNames.push(filename);
                            }
                            if (/^SLAM_fprintf\.log\.([0-9]{4})(\.rr)?\.gz$/.test(filename)) {
                                logFileName = filename;
                            }
                        });

                        possibleMapFileNames = possibleMapFileNames.sort();
                        mapFileName = possibleMapFileNames.pop();

                        if (mapFileName && logFileName) {
                            newestUsableFolderName = folder;
                            break;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

                if (newestUsableFolderName && mapFileName && logFileName) {
                    fs.readFile(path.join("/mnt/data/rockrobo/rrlog", newestUsableFolderName, logFileName), function (err, file) {
                        if (err) {
                            callback(err);
                        } else {
                            Tools.DECRYPT_AND_UNPACK_FILE(file, function (err, unzippedFile) {
                                if (err) {
                                    callback(err);
                                } else {
                                    const log = unzippedFile.toString();
                                    if (log.indexOf("estimate") !== -1) {
                                        fs.readFile(path.join("/mnt/data/rockrobo/rrlog", newestUsableFolderName, mapFileName), function (err, file) {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                Tools.DECRYPT_AND_UNPACK_FILE(file, function (err, unzippedFile) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                        var parsedMapData = Tools.PARSE_PPM_MAP(unzippedFile);

                                                        if(parsedMapData.map.length === 0) {
                                                            callback(new Error("No usable map data found"));
                                                        } else {
                                                            callback(null, {
                                                                mapData: parsedMapData,
                                                                log: log,
                                                            })
                                                        }
                                                    }
                                                });
                                            }
                                        })
                                    } else {
                                        callback(new Error("No usable map data found"));
                                    }
                                }
                            });
                        }
                    })
                } else {
                    callback(new Error("No usable map data found"));
                }
            }
        })
    },
    DECRYPT_AND_UNPACK_FILE: function (file, callback) {
        const decipher = crypto.createDecipheriv("aes-128-ecb", ENCRYPTED_ARCHIVE_DATA_PASSWORD, "");
        let decryptedBuffer;

        if (Buffer.isBuffer(file)) {
            //gzip magic bytes
            if (Tools.BUFFER_IS_GZIP(file)) {
                zlib.gunzip(file, callback);
            } else {
                try {
                    decryptedBuffer = Buffer.concat([decipher.update(file), decipher.final()]);
                } catch (e) {
                    return callback(e);
                }
                if (Tools.BUFFER_IS_GZIP(decryptedBuffer)) {
                    zlib.gunzip(decryptedBuffer, callback);
                } else {
                    callback(new Error("Couldn't decrypt file"));
                }
            }
        } else {
            callback(new Error("Missing file"))
        }
    },
    PARSE_GRID_MAP: function (buf) {
        const map = [];

        if (buf.length === CORRECT_GRID_MAP_FILE_SIZE) {
            for (let i = 0; i < buf.length; i++) {
                let px = buf.readUInt8(i);

                if (px !== 0) {
                    px = px === 1 ? 0 : px;
                    map.push([i + i * 3, px, px, px])
                }
            }
        }

        let width = 1024, height = 1024, size = 4;
        let transform = MapFunctions.TRANSFORM_COORD_FLIP_Y;
        for (let i = map.length - 1; i >= 0; --i) {
            let idx = map[i][0];
            let xy = MapFunctions.mapIndexToMapCoord(idx, width, height, size);
            let xy2 = MapFunctions.applyCoordTransform(transform, xy, width, height);
            map[i][0] = MapFunctions.mapCoordToMapIndex(xy2, width, height, size);
        }
        return {map: map, yFlipped: true};
    },
    PARSE_PPM_MAP: function (buf) {
        const map = [];

        for (let i = 17, j = 0; i <= buf.length - 16; i += 3, j++) {
            let r = buf.readUInt8(i);
            let g = buf.readUInt8(i + 1);
            let b = buf.readUInt8(i + 2);

            if (!(r === 125 && g === 125 && b === 125)) {
                map.push([j + j * 3, r, g, b])
            }
        }

        return {map: map, yFlipped: true};
    }
};

//TODO: is yFlipped even needed anymore?

module.exports = Tools;