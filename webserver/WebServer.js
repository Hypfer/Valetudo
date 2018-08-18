const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const spawnSync = require('child_process').spawnSync;
const zlib = require('zlib');
const crypto = require('crypto');
const bodyParser = require("body-parser");
const Jimp = require('jimp');
const url = require("url");

/**
 *
 * @param options
 * @param options.vacuum {Vacuum}
 * @param options.port {number}
 * @constructor
 */
const WebServer = function(options) {
    const self = this;

    this.vacuum = options.vacuum;
    this.port = options.port;

    this.app = express();
    this.app.use(compression());
    this.app.use(bodyParser.json());

    this.app.get("/api/current_status", function(req,res) {
        self.vacuum.getCurrentStatus(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.get("/api/consumable_status", function(req,res) {
        self.vacuum.getConsumableStatus(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                self.vacuum.getCleanSummary(function(err,data2){
                    if(err) {
                        res.status(500).send(err.toString());
                    } else {
                        res.json({
                            consumables: data,
                            summary: data2
                        });
                    }
                });
            }
        });
    });

    this.app.get("/api/wifi_status", function(req,res){
        /*
            root@rockrobo:~# iw
            Usage:  iw [options] command
            Do NOT screenscrape this tool, we don't consider its output stable.

            :-)
         */

        let err;
        const wifiConnection = {
            connected: false,
            connection_info: {
                bssid: null,
                ssid: null,
                freq: null,
                signal: null,
                tx_bitrate: null
            }
        };

        const iwOutput = spawnSync("iw", ["dev", "wlan0", "link"]).stdout;
        if(iwOutput) {
            const extractedWifiData = iwOutput.toString().match(WebServer.WIFI_CONNECTED_IW_REGEX);
            if(extractedWifiData) {
                wifiConnection.connected = true;

                wifiConnection.connection_info.bssid = extractedWifiData[1];
                wifiConnection.connection_info.ssid = extractedWifiData[2];
                wifiConnection.connection_info.freq = extractedWifiData[3];
                wifiConnection.connection_info.signal = extractedWifiData[4];
                wifiConnection.connection_info.tx_bitrate = extractedWifiData[5];
            }
        }

        res.json(wifiConnection);
    });

    this.app.get("/api/timers", function(req,res) {
        self.vacuum.getTimers(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.post("/api/timers", function(req,res){
        if(req.body && req.body.cron) {
            self.vacuum.addTimer(req.body.cron, function(err,data){
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("invalid request");
        }
    });

    this.app.put("/api/timers/:timerID", function(req,res){
        if(req.body && req.body.enabled !== undefined) {
            self.vacuum.toggleTimer(req.params.timerID, req.body.enabled, function(err,data){
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.delete("/api/timers/:timerID", function(req,res){
        self.vacuum.deleteTimer(req.params.timerID, function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        })
    });

    this.app.put("/api/start_cleaning", function(req,res){
        self.vacuum.startCleaning(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/pause_cleaning", function(req,res){
        self.vacuum.pauseCleaning(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/stop_cleaning", function(req,res){
        self.vacuum.stopCleaning(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/fanspeed", function(req,res) {
        if(req.body && req.body.speed && req.body.speed <= 105 && req.body.speed >= 0) {
            self.vacuum.setFanSpeed(req.body.speed, function(err,data) {
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid speed");
        }
    });

    this.app.put("/api/wifi_configuration", function(req,res) {
        if(req.body && req.body.ssid && req.body.password) {
            self.vacuum.configureWifi(req.body.ssid, req.body.password, function(err,data) {
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid wifi configuration");
        }
    });


    this.app.put("/api/reset_consumable", function(req,res) {
        if(req.body && typeof req.body.consumable === "string") {
            self.vacuum.resetConsumable(req.body.consumable, function(err,data) {
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.put("/api/find_robot", function(req,res){
        self.vacuum.findRobot(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/drive_home", function(req,res){
        self.vacuum.driveHome(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/start_manual_control", function(req,res){
        self.vacuum.startManualControl(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/stop_manual_control", function(req,res){
        self.vacuum.stopManualControl(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/set_manual_control", function(req,res){
        if(req.body && req.body.angle !== undefined && req.body.velocity !== undefined 
            && req.body.duration !== undefined && req.body.sequenceId !== undefined) {
            self.vacuum.setManualControl(req.body.angle, req.body.velocity, req.body.duration, req.body.sequenceId, function(err,data){
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
        }
    });

    this.app.get("/api/remote/map", function(req,res){
        

        WebServer.FIND_LATEST_MAP(function(err, data){
            if(!err) {
                var width=1024;
                var height=width;
                //create current map
                new Jimp(width, height, function(err, image) {
                    if(!err) {
                        //configuration
                        //default parameter
                        var scale=4;
                        var doCropping=true;
                        var border=2;
                        //var drawMap = true; //not implemented yet
                        var drawPath = true;
                        var drawCharger = true;
                        var drawRobot = true;
                        //get given parameter
                        var urlObj = url.parse(req.url, true);
                        if (urlObj['query']['scale'] !== undefined) {
                            scale = parseInt(urlObj['query']['scale'] );
                        }
                        if (urlObj['query']['border'] !== undefined) {
                            border = parseInt(urlObj['query']['border'] );
                        }
                        if (urlObj['query']['drawPath'] !== undefined) {
                            drawPath = (urlObj['query']['drawPath'] == 'true');
                        }
                        if (urlObj['query']['doCropping'] !== undefined) {
                            doCropping = (urlObj['query']['doCropping'] == 'true');
                        }
                        if (urlObj['query']['drawCharger'] !== undefined) {
                            drawCharger = (urlObj['query']['drawCharger'] == 'true');
                        }
                        if (urlObj['query']['drawRobot'] !== undefined) {
                            drawRobot = (urlObj['query']['drawRobot'] == 'true');
                        }
                        //for cropping
                        var xMin=width;
                        var xMax=0;
                        var yMin=height;
                        var yMax=0;
                        //variables for colors
                        let color;
                        let colorFree=Jimp.rgbaToInt(0,118,255,255);
                        let colorObstacleStrong=Jimp.rgbaToInt(102,153,255,255);
                        let colorObstacleWeak=Jimp.rgbaToInt(82,174,255,255);
                        data.map.forEach(function (px) {
                            //calculate positions of pixel number
                            var yPos = Math.floor(px[0] / (height*4));
                            var xPos = ((px[0] - yPos*(width*4))/4);
                            //cropping
                            if (yPos>yMax) yMax=yPos;
                            else if (yPos<yMin) yMin=yPos;
                            if (xPos>xMax) xMax=xPos;
                            else if (xPos<xMin) xMin=xPos;
                            if (px[1] === 0 && px[2] === 0 && px[3] === 0) {
                                color=colorObstacleStrong;
                            }
                            else if (px[1] === 255 && px[2] === 255 && px[3] === 255) {
                                color=colorFree;
                            }
                            else {
                                color=colorObstacleWeak;
                            }
                            //set pixel on position
                            image.setPixelColor(color, xPos, yPos );
                        });
                        //crop to the map content
                        let croppingOffsetX = 0;
                        let croppingOffsetY = 0;
                        if (doCropping) {
                            croppingOffsetX = (xMin-border);
                            croppingOffsetY = (yMin-border);
                            image.crop( croppingOffsetX, croppingOffsetY, xMax-xMin+2*border, yMax-yMin+2*border );
                        }
                        //scale the map
                        image.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
                        //draw path
                        //1. get coordinates (take respekt of reset)
                        const lines = data.log.split("\n");
                        let coords = [];
                        let line;
                        var startLine = 0;
                        if (!drawPath && lines.length > 10) {
                            //reduce unnecessarycalculation time if path is not drawn 
                            startLine = lines.length-10;
                        }
                        for (var lc = startLine, len = lines.length; lc < len; lc++) {
                            line = lines[lc];
                            if(line.indexOf("reset") !== -1) {
                                coords = [];
                            }
                            if(line.indexOf("estimate") !== -1) {
                                let splitLine = line.split(" ");
                                let x = (width/2) + (splitLine[2] * 20) ;
                                let y = splitLine[3] * 20;
                                if(data.isNavMap) {
                                    y = y*-1;
                                }
                                //move coordinates to match cropped pane
                                x -= croppingOffsetX;
                                y -= croppingOffsetY;
                                coords.push([
                                    Math.round(x*scale),
                                    Math.round(((width/2)+y)*scale)
                                ]);
                            }
                        };
                        //2. draw path
                        let first = true;
                        let pathColor = Jimp.rgbaToInt(255,255,255,255);
                        let oldPathX, oldPathY; // old Coordinates
                        let dx, dy; //delta x and y
                        let step, x, y, i;
                        coords.forEach(function (coord) {
                            if (!first && drawPath) {
                                dx = (coord[0] - oldPathX);
                                dy = (coord[1] - oldPathY);
                                if(Math.abs(dx) >= Math.abs(dy)) {
                                    step = Math.abs(dx);
                                }
                                else {
                                    step = Math.abs(dy);
                                }
                                dx = dx / step;
                                dy = dy / step;
                                x = oldPathX;
                                y = oldPathY;
                                i = 1;
                                while(i <= step) {
                                    image.setPixelColor(pathColor, x, y);
                                    x = x + dx;
                                    y = y + dy;
                                    i = i + 1;
                                }
                            }
                            oldPathX = coord[0];
                            oldPathY = coord[1];
                            first = false;
                        });
                        var robotPositionX = oldPathX;
                        var robotPositionY = oldPathY;
                        var robotAngle = 0;
                        if (coords.length > 2) {
                            //the image has the offset of 90 degrees (top = 0 deg)
                            robotAngle =90 + Math.atan2(coords[coords.length - 1][1] - coords[coords.length - 2][1], coords[coords.length - 1][0] - coords[coords.length - 2][0]) * 180 / Math.PI;
                        }
                        //use process.env.VAC_TMP_PATH to define a path on your dev machine - like C:/Windows/Temp
                        var tmpDir = (process.env.VAC_TMP_PATH ? process.env.VAC_TMP_PATH : "/tmp");
                        var directory = "/maps/";
                        if (!fs.existsSync(tmpDir + directory)){
                                fs.mkdirSync(tmpDir + directory);
                        }
                        //delete old image (keep the last 5 images generated)
                        var numerOfFiles =0;
                        fs.readdirSync(tmpDir + directory)
                        .sort(function(a, b) {return a < b;})
                        .forEach(function (file) {
                            numerOfFiles++;
                            if (numerOfFiles>5)  {
                                fs.unlink(tmpDir + directory + file, err => { if (err) console.log(err) });
                                //console.log( "removing " + toClientDir + directory + file);
                            }
                        });
                        //Position on the bitmap (0/0 is bottom-left)
                        var homeX=0;
                        var homeY=0;
                        var imagePath;
                        //set charger position
                        homeX = ((width / 2) - croppingOffsetX) * scale;
                        homeY = ((height / 2) - croppingOffsetY) *  scale;
                        //some  debugging stuff:
                        image.setPixelColor(Jimp.rgbaToInt(255,0,0,255), robotPositionX, robotPositionY); //red robot position
                        image.setPixelColor(Jimp.rgbaToInt(0,255,0,255), homeX, homeY); //red robot position
                        //save image
                        var date = new Date();
                        var dd = (date.getDate() < 10 ? '0' : '') + date.getDate();
                        var mm = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
                        var yyyy = date.getFullYear();
                        var HH = (date.getHours()<10?'0':'') + date.getHours();
                        var MM = (date.getMinutes()<10?'0':'') + date.getMinutes();
                        var SS = (date.getSeconds()<10?'0':'') + date.getSeconds();
                        var fileName = yyyy + "-" + mm + "-" + dd + "_" + HH + "-" + MM + "-" + SS + ".png";
                        imagePath = directory + fileName;
                        //Pretty dumb case selection, but I have no idea how to get this implemented in a more clever way.
                        //Help/Suggestions are (as always) very welcome!
                        if (!drawCharger && !drawRobot) {
                            console.log("Drawing no charger - no robot!");
                            image.write(tmpDir + imagePath);
                        } else if (drawRobot) {
                            //robot should be drawn (and maybe charger)
                            Jimp.read('./client/img/robot.png')
                                .then(robotImage => {
                                    let xPos = robotPositionX - robotImage.bitmap.width/2;
                                    let yPos = robotPositionY - robotImage.bitmap.height/2;
                                    robotImage.rotate(-1* robotAngle); //counter clock wise
                                    image.composite(robotImage, xPos, yPos);
                                    if (drawCharger) {
                                        Jimp.read('./client/img/charger.png')
                                            .then(chargerImage => {
                                                let xPos = homeX - chargerImage.bitmap.width/2;
                                                let yPos = homeY - chargerImage.bitmap.height/2;
                                                image.composite(chargerImage, xPos, yPos);
                                                //console.log("Drawing charger - robot!");
                                                image.write(tmpDir + imagePath);
                                            });
                                    } else {
                                        //console.log("Drawing no charger - robot!");
                                        image.write(tmpDir + imagePath);
                                    }
                                });
                        } else {
                            //draw charger but no robot
                            Jimp.read('./client/img/charger.png')
                                .then(chargerImage => {
                                    let xPos = homeX - chargerImage.bitmap.width/2;
                                    let yPos = homeY - chargerImage.bitmap.height/2;
                                    image.composite(chargerImage, xPos, yPos);
                                    //console.log("Drawing charger - no robot!");
                                    image.write(tmpDir + imagePath);
                                });
                        }
                        //define return value
                        res.json({
                            scale,
                            border : border*scale,
                            doCropping,
                            drawPath,
                            mapsrc : imagePath,
                            drawCharger,
                            charger : [homeX, homeY],
                            drawRobot,
                            robot : [robotPositionX, robotPositionY],
                            robotAngle : Math.round(robotAngle)
                        });
                    } else {
                        res.status(500).send(err.toString());
                    }
                });
            } else {
                res.status(500).send(err.toString());
            }
        });
    });

    this.app.get("/api/map/latest", function(req,res){
        WebServer.FIND_LATEST_MAP(function(err, data){
            if(!err) {
                const lines = data.log.split("\n");
                let coords = [];

                lines.forEach(function(line){
                    if(line.indexOf("reset") !== -1) {
                        coords = [];
                    }
                    if(line.indexOf("estimate") !== -1) {
                        let splitLine = line.split(" ");
                        let x = 512 + (splitLine[2] * 20);
                        let y = splitLine[3] * 20;

                        if(data.isNavMap) {
                            y = y*-1;
                        }

                        coords.push([
                            Math.round(x*4),
                            Math.round((512+y)*4)
                        ]);
                    }
                });

                res.json({
                    path: coords,
                    map: data.map
                });
            } else {
                res.status(500).send(err.toString());
            }
        });
    });


    this.app.get("/api/token", function(req,res){
        res.json({
            token: self.vacuum.token.toString("hex")
        });
    });

    //this results in searching client folder first and
    //if file was not found within that folder, the tmp folder will be searched for that file
    this.app.use(express.static(path.join(__dirname, "..", 'client')));
    this.app.use(express.static((process.env.VAC_TMP_PATH ? process.env.VAC_TMP_PATH : "/tmp")));
    this.app.listen(this.port, function(){
        console.log("Webserver running on port", self.port)
    })
};

WebServer.PARSE_PPM_MAP = function(buf) {
    const map = [];

    if (buf.length === WebServer.CORRECT_PPM_MAP_FILE_SIZE) {
        for (let i = 17, j = 0; i <= buf.length - 16; i += 3, j++) {
            let r = buf.readUInt8(i);
            let g = buf.readUInt8(i + 1);
            let b = buf.readUInt8(i + 2);

            if (!(r === 125 && g === 125 && b === 125)) {
                map.push([j+j*3, r, g, b])
            }
        }
    }

    return map;
};

WebServer.PARSE_GRID_MAP = function(buf) {
    const map = [];

    if(buf.length = WebServer.CORRECT_GRID_MAP_FILE_SIZE) {
        for (let i = 0; i < buf.length; i++) {
            let px = buf.readUInt8(i);

            if(px !== 0) {
                px = px === 1 ? 0 : px;
                map.push([i + i * 3, px, px, px])
            }
        }
    }

    return map;
};

WebServer.FIND_LATEST_MAP = function(callback) {
    if(process.env.VAC_MAP_TEST) {
        callback(null, {
            map: WebServer.PARSE_PPM_MAP(fs.readFileSync("./map")),
            log: fs.readFileSync("./log").toString(),
            isNavMap: true
        })
    } else {
        WebServer.FIND_LATEST_MAP_IN_RAMDISK(callback);
    }
};

WebServer.FIND_LATEST_MAP_IN_RAMDISK = function(callback) {
    fs.readdir("/dev/shm", function(err, filenames){
        if(err) {
            callback(err);
        } else {
            let mapFileName;
            let logFileName;

            filenames.forEach(function(filename){
                if(filename.endsWith(".ppm")) {
                    mapFileName = filename;
                }
                if(filename === "SLAM_fprintf.log") {
                    logFileName = filename;
                }
            });

            if(mapFileName && logFileName) {
                fs.readFile(path.join("/dev/shm", logFileName), function(err, file){
                    if(err) {
                        callback(err);
                    } else {
                        const log = file.toString();
                        if(log.indexOf("estimate") !== -1) {
                            let mapPath = path.join("/dev/shm", mapFileName);

                            fs.readFile(mapPath, function(err, file){
                                if(err) {
                                    callback(err);
                                } else {
                                    if(file.length !== WebServer.CORRECT_PPM_MAP_FILE_SIZE) {
                                        let tries = 0;
                                        let newFile = new Buffer.alloc(0);

                                        //I'm 1000% sure that there is a better way to fix incompletely written map files
                                        //But since its a ramdisk I guess this hack shouldn't matter that much
                                        //Maybe someday I'll implement a better solution. Not today though
                                        while (newFile.length !== WebServer.CORRECT_PPM_MAP_FILE_SIZE && tries <= 250) {
                                            tries++;
                                            newFile = fs.readFileSync(mapPath);
                                        }

                                        if(newFile.length === WebServer.CORRECT_PPM_MAP_FILE_SIZE) {
                                            callback(null, {
                                                map: WebServer.PARSE_PPM_MAP(newFile),
                                                log: log,
                                                isNavMap: true
                                            })
                                        } else {
                                            fs.readFile("/dev/shm/GridMap", function(err, gridMapFile){
                                                if(err) {
                                                    callback(new Error("Unable to get complete map file"))
                                                } else {
                                                    callback(null, {
                                                        map: WebServer.PARSE_GRID_MAP(gridMapFile),
                                                        log: log,
                                                        isNavMap: false
                                                    })
                                                }
                                            })
                                        }
                                    } else {
                                        callback(null, {
                                            map: WebServer.PARSE_PPM_MAP(file),
                                            log: log,
                                            isNavMap: true
                                        })
                                    }
                                }
                            })
                        } else {
                            WebServer.FIND_LATEST_MAP_IN_ARCHIVE(callback)
                        }
                    }
                })
            } else {
                WebServer.FIND_LATEST_MAP_IN_ARCHIVE(callback)
            }
        }
    })
};

WebServer.FIND_LATEST_MAP_IN_ARCHIVE = function(callback) {
    fs.readdir("/mnt/data/rockrobo/rrlog", function(err, filenames){
        if(err) {
            callback(err);
        } else {
            let folders = [];

            filenames.forEach(function(filename){
                if(/^([0-9]{6})\.([0-9]{17})_(R([0-9]{4})S([0-9]{8})|[0-9]{13})_([0-9]{10})REL$/.test(filename)) {
                    folders.push(filename);
                }
            });
            folders = folders.sort();

            let newestUsableFolderName;
            let mapFileName;
            let logFileName;

            for(let i in folders) {
                const folder = folders.pop();
                try {
                    const folderContents = fs.readdirSync(path.join("/mnt/data/rockrobo/rrlog", folder));
                    let possibleMapFileNames = [];
                    mapFileName = undefined;
                    logFileName = undefined;


                    folderContents.forEach(function(filename){
                        if(/^navmap([0-9]+)\.ppm\.([0-9]{4})\.gz$/.test(filename)) {
                            possibleMapFileNames.push(filename);
                        }
                        if(/^SLAM_fprintf\.log\.([0-9]{4})\.gz$/.test(filename)) {
                            logFileName = filename;
                        }
                    });

                    possibleMapFileNames = possibleMapFileNames.sort();
                    mapFileName = possibleMapFileNames.pop();

                    if(mapFileName && logFileName) {
                        newestUsableFolderName = folder;
                        break;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if(newestUsableFolderName && mapFileName && logFileName) {
                fs.readFile(path.join("/mnt/data/rockrobo/rrlog", newestUsableFolderName, logFileName), function(err, file){
                    if(err) {
                        callback(err);
                    } else {
                        WebServer.DECRYPT_AND_UNPACK_FILE(file, function(err, unzippedFile){
                            if(err) {
                                callback(err);
                            } else {
                                const log = unzippedFile.toString();
                                if(log.indexOf("estimate") !== -1) {
                                    fs.readFile(path.join("/mnt/data/rockrobo/rrlog", newestUsableFolderName, mapFileName), function(err, file){
                                        if(err) {
                                            callback(err);
                                        } else {
                                            WebServer.DECRYPT_AND_UNPACK_FILE(file, function(err, unzippedFile){
                                                if(err) {
                                                    callback(err);
                                                } else {
                                                    callback(null, {
                                                        map: WebServer.PARSE_PPM_MAP(unzippedFile),
                                                        log: log,
                                                        isNavMap: true
                                                    })
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
};

WebServer.DECRYPT_AND_UNPACK_FILE = function(file, callback) {
    const decipher = crypto.createDecipheriv("aes-128-ecb", WebServer.ENCRYPTED_ARCHIVE_DATA_PASSWORD, "");
    let decryptedBuffer;

    if(Buffer.isBuffer(file)) {
        //gzip magic bytes
        if(WebServer.BUFFER_IS_GZIP(file)) {
            zlib.gunzip(file, callback);
        } else {
            try {
                decryptedBuffer = Buffer.concat([decipher.update(file), decipher.final()]);
            } catch(e) {
                return callback(e);
            }
            if(WebServer.BUFFER_IS_GZIP(decryptedBuffer)) {
                zlib.gunzip(decryptedBuffer, callback);
            } else {
                callback(new Error("Couldn't decrypt file"));
            }
        }
    } else {
        callback(new Error("Missing file"))
    }
};

WebServer.BUFFER_IS_GZIP = function(buf) {
    return Buffer.isBuffer(buf) && buf[0] === 0x1f && buf[1] === 0x8b;
};

WebServer.CORRECT_PPM_MAP_FILE_SIZE = 3145745;
WebServer.CORRECT_GRID_MAP_FILE_SIZE = 1048576;
WebServer.ENCRYPTED_ARCHIVE_DATA_PASSWORD = Buffer.from("RoCKR0B0@BEIJING");

//This is the sole reason why I've bought a 21:9 monitor
WebServer.WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;

module.exports = WebServer;