const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const spawnSync = require("child_process").spawnSync;
const zlib = require("zlib");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const Jimp = require("jimp");
const url = require("url");

const MapFunctions = require("../client/js/MapFunctions");


//assets
const chargerImagePath = path.join(__dirname, '../client/img/charger.png');
const robotImagePath = path.join(__dirname, '../client/img/robot.png');

const defaultConfigFileLocation = "/mnt/data/valetudo/config.json"

/**
 *
 * @param options
 * @param options.vacuum {Vacuum}
 * @param options.port {number}
 * @param options.configFileLocation {configFileLocation}
 * @constructor
 */
const WebServer = function(options) {
    const self = this;

    this.vacuum = options.vacuum;
    this.port = options.port;
    this.configFileLocation = options.configFileLocation;

    /* this is the default configuration */
    this.configuration = {"spots": [],
                          "areas": [] };

    this.app = express();
    this.app.use(compression());
    this.app.use(bodyParser.json());

    function writeConfigToFile(){
        fs.writeFile(self.configFileLocation, JSON.stringify(self.configuration), (err) => {
            if (err) {
                console.error(err);
                return;
            };
        });
    }

    /* load an existing configuration file. if it is not present, create it using the default configuration */
    if(fs.existsSync(this.configFileLocation)) {
        console.log("Loading configuration file:", this.configFileLocation)
        var contents = fs.readFileSync(this.configFileLocation)
        this.configuration = JSON.parse(contents);
    } else {
        console.log("No configuration file present. Creating one at:", this.configFileLocation)
        WebServer.MK_DIR_PATH(path.dirname(this.configFileLocation));
        writeConfigToFile();
    }

    // I don't know a better way to get the configuration in scope for static methods...
    WebServer.configuration = this.configuration;

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

    this.app.get("/api/get_fw_version", function(req,res){
        fs.readFile("/etc/os-release", function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                const extractedOsRelease = data.toString().match(WebServer.OS_RELEASE_FW_REGEX);
                if (extractedOsRelease) {
                    const splittedFw = extractedOsRelease[11].split('_');
                    res.json({
                        version: splittedFw[0],
                        build: splittedFw[1]
                    });
                }
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

    this.app.put("/api/go_to", function(req,res) {
        if(req.body && req.body.x !== undefined && req.body.y !== undefined) {
            self.vacuum.goTo(req.body.x, req.body.y, function(err,data) {
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    this.app.put("/api/start_cleaning_zone", function(req,res) {
        if(req.body) {
            self.vacuum.startCleaningZone(req.body, function(err,data) {
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    this.app.get("/api/get_config", function(req,res) {
        res.json(self.configuration);
    });

    this.app.put("/api/set_config", function(req,res) {
        if(req.body && req.body.config) {
            self.configuration = req.body.config;
            writeConfigToFile();
            WebServer.configuration = self.configuration;
            res.json('OK');
        } else {
            res.status(400).send("config missing");
        }
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

    this.app.put("/api/set_sound_volume", function(req,res) {
        if(req.body && req.body.volume && req.body.volume <= 100 && req.body.volume >= 0) {
            self.vacuum.setSoundVolume(req.body.volume, function(err,data) {
                if(err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid sound volume");
        }
    });

    this.app.get("/api/get_sound_volume", function(req,res) {
        self.vacuum.getSoundVolume(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/test_sound_volume", function(req,res){
        self.vacuum.testSoundVolume(function(err,data){
            if(err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
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

    this.app.put("/api/spot_clean", function(req,res){
        self.vacuum.spotClean(function(err,data){
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
            if(!err && data.mapData.map.length > 0) {
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
                        var drawPath = true;
                        var drawCharger = true;
                        var drawRobot = true;
                        var returnImage = false;    // per default: do not change output -> keep it default
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
                        // returnImage: identical to previous query checks
                        if (urlObj['query']['returnImage'] !== undefined) {
                            returnImage = (urlObj['query']['returnImage'] == 'true');
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
                        data.mapData.map.forEach(function (px) {
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
                                if(data.mapData.yFlipped) {
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
                        //Pretty dumb case selection (doubled code for charger drawing), but no idea how to get this implemented in a more clever way.
                        //Help/Suggestions are (as always) very welcome!
                        //send result
                        function sendResult() {
                            // if returnImage is true, send directly the previously created map image
                            if (returnImage) {
                                // readFile with absolute path
                                fs.readFile(tmpDir + imagePath, function (err, content) {
                                    if (err) {
                                        res.status(500).send(err.toString());
                                    } else {
                                        //specify response content
                                        res.writeHead(200,{'Content-type':'image/png'});
                                        res.end(content);
                                    }
                                });
                            } else {
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
                            }
                        }
                        if (!drawCharger && !drawRobot) {
                            //console.log("Drawing no charger - no robot!");
                            image.write(tmpDir + imagePath);
                            sendResult();
                        } else if (drawRobot) {
                            //robot should be drawn (and maybe charger)
                            Jimp.read(robotImagePath)
                                .then(robotImage => {
                                    let xPos = robotPositionX - robotImage.bitmap.width/2;
                                    let yPos = robotPositionY - robotImage.bitmap.height/2;
                                    robotImage.rotate(-1 * robotAngle); //counter clock wise
                                    image.composite(robotImage, xPos, yPos);
                                    if (drawCharger) {
                                        Jimp.read(chargerImagePath)
                                            .then(chargerImage => {
                                                let xPos = homeX - chargerImage.bitmap.width/2;
                                                let yPos = homeY - chargerImage.bitmap.height/2;
                                                image.composite(chargerImage, xPos, yPos);
                                                //console.log("Drawing charger - robot!");
                                                image.write(tmpDir + imagePath);
                                                sendResult();
                                            });
                                    } else {
                                        //console.log("Drawing no charger - robot!");
                                        image.write(tmpDir + imagePath);
                                        sendResult();
                                    }
                                });
                        } else {
                            //draw charger but no robot
                            Jimp.read(chargerImagePath)
                                .then(chargerImage => {
                                    let xPos = homeX - chargerImage.bitmap.width/2;
                                    let yPos = homeY - chargerImage.bitmap.height/2;
                                    image.composite(chargerImage, xPos, yPos);
                                    //console.log("Drawing charger - no robot!");
                                    image.write(tmpDir + imagePath);
                                    sendResult();
                                });
                        }
                    } else {
                        res.status(500).send(err.toString());
                    }
                });
            } else {
                res.status(500).send(err != null ? err.toString() : "No usable map found, start cleaning and try again.");
            }
        });
    });

    this.app.get("/api/map/latest", function(req,res){
        var parsedUrl = url.parse(req.url, true);
        const doNotTransformPath = parsedUrl.query.doNotTransformPath !== undefined;
        WebServer.FIND_LATEST_MAP(function(err, data){
            if(!err) {
                const lines = data.log.split("\n");
                let coords = [];

                lines.forEach(function(line){
                    if(line.indexOf("reset") !== -1) {
                        coords = [];
                    }
                    if(line.indexOf("estimate") !== -1) {
                        let sl = line.split(" ");
                        let lx = sl[2];
                        let ly = sl[3];
                        if(doNotTransformPath) {
                            coords.push([lx, ly]);
                        } else {
                            coords.push(MapFunctions.logCoordToCanvasCoord([lx, ly], data.mapData.yFlipped));
                        }
                    }
                });
                res.json({
                    yFlipped: data.mapData.yFlipped,
                    path: coords,
                    map: data.mapData.map
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

    return { map: map, yFlipped: true };
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

    // y will be flipped by default, unless dontFlipGridMap is set in the configuration.
    let yFlipped = !WebServer.configuration.dontFlipGridMap;
    if (yFlipped) {
        let width = 1024, height = 1024, size = 4;
        let transform = MapFunctions.TRANSFORM_COORD_FLIP_Y;
        for (let i = map.length - 1; i >= 0; --i) {
            let idx = map[i][0];
            let xy = MapFunctions.mapIndexToMapCoord(idx, width, height, size);
            let xy2 = MapFunctions.applyCoordTransform(transform, xy, width, height);
            map[i][0] = MapFunctions.mapCoordToMapIndex(xy2, width, height, size);
        }
    }
    return { map: map, yFlipped: yFlipped };

};

WebServer.PARSE_MAP_AUTO = function(filename) {
    // this function automatically determines whether a GridMap or PPM map is used, based on file size.
    let mapData = { map: [], yFlipped: true };
    try {
        const mapBytes = fs.readFileSync(filename);
        if (mapBytes.length === WebServer.CORRECT_GRID_MAP_FILE_SIZE) {
            mapData = WebServer.PARSE_GRID_MAP(mapBytes);
        } else if (mapBytes.length === WebServer.CORRECT_PPM_MAP_FILE_SIZE) {
            mapData = WebServer.PARSE_PPM_MAP(mapBytes);
        }
        // else: map stays empty
    } catch (err) {
        // map stays empty
    }
    return mapData;
};

WebServer.GENERATE_TEST_MAP = function() {
    let mapData = [];
    for(let y = 0; y < 1024; y++) {
        for(let x = 0; x < 1024; x++) {
            let index = 4 * (y * 1024 + x);

            // 4x4m square
            if(x >= 472 && x <= 552 && y >= 472 && y <= 552) {
                if(x == 472 || x == 552 || y == 472 || y == 552) {
                    mapData.push([index, 0, 0, 0]);
                } else {
                    mapData.push([index, 255, 255, 255]);
                }
            }
        }
    }
    return {map: mapData, yFlipped: false};
}

WebServer.GENERATE_TEST_PATH = function() {
    let lines = [
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
    return lines.join("\n");
}


WebServer.FIND_LATEST_MAP = function(callback) {
    if(process.env.VAC_MAP_TEST) {
        callback(null, {
            mapData: WebServer.GENERATE_TEST_MAP(),
            log: WebServer.GENERATE_TEST_PATH()
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

                            let loadGridMap = function() {
                                fs.readFile("/dev/shm/GridMap", function (err, gridMapFile) {
                                    if (err) {
                                        callback(new Error("Unable to get complete map file"))
                                    } else {
                                        callback(null, {
                                            mapData: WebServer.PARSE_GRID_MAP(gridMapFile),
                                            log: log
                                        })
                                    }
                                })
                            };

                            // if the user knows that there will only ever be usable gridmaps,
                            // setting the configuration option "preferGridMap" will take a shortcut.
                            if (WebServer.configuration.preferGridMap) {
                                loadGridMap();
                            } else {
                                let mapPath = path.join("/dev/shm", mapFileName);

                                fs.readFile(mapPath, function (err, file) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        if (file.length !== WebServer.CORRECT_PPM_MAP_FILE_SIZE) {
                                            let tries = 0;
                                            let newFile = new Buffer.alloc(0);

                                            //I'm 1000% sure that there is a better way to fix incompletely written map files
                                            //But since its a ramdisk I guess this hack shouldn't matter that much
                                            //Maybe someday I'll implement a better solution. Not today though
                                            while (newFile.length !== WebServer.CORRECT_PPM_MAP_FILE_SIZE && tries <= 250) {
                                                tries++;
                                                newFile = fs.readFileSync(mapPath);
                                            }

                                            if (newFile.length === WebServer.CORRECT_PPM_MAP_FILE_SIZE) {
                                                callback(null, {
                                                    mapData: WebServer.PARSE_PPM_MAP(newFile),
                                                    log: log
                                                })
                                            } else {
                                                loadGridMap();
                                            }
                                        } else {
                                            callback(null, {
                                                mapData: WebServer.PARSE_PPM_MAP(file),
                                                log: log
                                            })
                                        }
                                    }
                                })
                            }
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
            folders = folders.sort().reverse();

            let newestUsableFolderName;
            let mapFileName;
            let logFileName;

            for(let i in folders) {
                const folder = folders[i];
                try {
                    const folderContents = fs.readdirSync(path.join("/mnt/data/rockrobo/rrlog", folder));
                    let possibleMapFileNames = [];
                    mapFileName = undefined;
                    logFileName = undefined;


                    folderContents.forEach(function(filename){
                        if(/^navmap([0-9]+)\.ppm\.([0-9]{4})(\.rr)?\.gz$/.test(filename)) {
                            possibleMapFileNames.push(filename);
                        }
                        if(/^SLAM_fprintf\.log\.([0-9]{4})(\.rr)?\.gz$/.test(filename)) {
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
                                                        mapData: WebServer.PARSE_PPM_MAP(unzippedFile),
                                                        log: log,
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


WebServer.MK_DIR_PATH = function(filepath) {
    var dirname = path.dirname(filepath);
    if (!fs.existsSync(dirname)) {
        WebServer.MK_DIR_PATH(dirname);
    }
    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath);
    }

}

WebServer.CORRECT_PPM_MAP_FILE_SIZE = 3145745;
WebServer.CORRECT_GRID_MAP_FILE_SIZE = 1048576;
WebServer.ENCRYPTED_ARCHIVE_DATA_PASSWORD = Buffer.from("RoCKR0B0@BEIJING");

//This is the sole reason why I've bought a 21:9 monitor
WebServer.WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;
WebServer.OS_RELEASE_FW_REGEX = /^NAME=(.*)\nVERSION=(.*)\nID=(.*)\nID_LIKE=(.*)\nPRETTY_NAME=(.*)\nVERSION_ID=(.*)\nHOME_URL=(.*)\nSUPPORT_URL=(.*)\nBUG_REPORT_URL=(.*)\n(ROCKROBO|ROBOROCK)_VERSION=(.*)/;

module.exports = WebServer;
