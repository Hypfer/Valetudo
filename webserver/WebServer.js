const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const spawnSync = require('child_process').spawnSync;
const zlib = require('zlib');
const bodyParser = require("body-parser");

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
        if(req.body && req.body.speed && req.body.speed <= 100 && req.body.speed >= 0) {
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
                        let y = 512 + (splitLine[3] * 20);

                        if(data.isNavMap) {
                            y = y*-1;
                        }

                        coords.push([
                            Math.round(x*4),
                            Math.round(y*4)
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

    this.app.get("/api/map/full", function (req, res) {
        WebServer.FIND_LATEST_MAP(function (err, data) {
            if (!err) {
                const lines = data.log.split("\n");
                let coords = [];
                const map = [];

                lines.forEach(function (line) {
                    if (line.indexOf("reset") !== -1) {
                        coords = [];
                    }
                    if (line.indexOf("estimate") !== -1) {
                        let splitLine = line.split(" ");

                        coords.push([
                            Math.round((512 + (splitLine[2] * 20)) * 4),
                            Math.round((512 + (splitLine[3] * 20) * -1) * 4)
                        ]);
                    }
                });

                if (data.map.length === WebServer.CORRECT_MAP_FILE_SIZE) {
                    for (let i = 17, j = 0; i <= data.map.length - 16; i += 3, j++) {
                        let r = data.map.readUInt8(i);
                        let g = data.map.readUInt8(i + 1);
                        let b = data.map.readUInt8(i + 2);

                        if (!(r === 125 && g === 125 && b === 125)) {
                            map.push([j + j * 3, r, g, b])
                        }
                    }
                }


                res.json({
                    path: coords,
                    map: map
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

    this.app.use(express.static(path.join(__dirname, "..", 'client')));
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
           map: WebServer.PARSE_GRID_MAP(fs.readFileSync("./map")),
           log: fs.readFileSync("./log").toString(),
           isNavMap: false
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
                if(/^([0-9]{6})\.([0-9]{17})_R([0-9]{4})S([0-9]{8})_([0-9]{10})REL$/.test(filename)) {
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
                        zlib.gunzip(file, function(err, unzippedFile){
                            if(err) {
                                callback(err);
                            } else {
                                const log = unzippedFile.toString();
                                if(log.indexOf("estimate") !== -1) {
                                    fs.readFile(path.join("/mnt/data/rockrobo/rrlog", newestUsableFolderName, mapFileName), function(err, file){
                                        if(err) {
                                            callback(err);
                                        } else {
                                            zlib.gunzip(file, function(err, unzippedFile){
                                                if(err) {
                                                    callback(err);
                                                } else {
                                                    callback(null, {
                                                        map: WebServer.PARSE_PPM_MAP(unzippedFile),
                                                        log: log,
                                                        isNavMap: true
                                                    })
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    callback(new Error("No usable map data found"));
                                }
                            }
                        })
                    }
                })
            } else {
                callback(new Error("No usable map data found"));
            }
        }
    })
};

WebServer.CORRECT_PPM_MAP_FILE_SIZE = 3145745;
WebServer.CORRECT_GRID_MAP_FILE_SIZE = 1048576;

//This is the sole reason why I've bought a 21:9 monitor
WebServer.WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;

module.exports = WebServer;