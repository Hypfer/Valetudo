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

const MapFunctions = require("../../client/js/MapFunctions");
const Tools = require("../Tools");


//assets
const chargerImagePath = path.join(__dirname, '../../client/img/charger.png');
const robotImagePath = path.join(__dirname, '../../client/img/robot.png');

/**
 *
 * @param options
 * @param options.vacuum {Vacuum}
 * @param options.port {number}
 * @param options.configuration {Configuration}
 * @constructor
 */
const WebServer = function (options) {
    const self = this;

    this.vacuum = options.vacuum;
    this.port = options.port;
    this.configuration = options.configuration;

    this.app = express();
    this.app.use(compression());
    this.app.use(bodyParser.json());


    this.app.get("/api/current_status", function (req, res) {
        self.vacuum.getCurrentStatus(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.get("/api/consumable_status", function (req, res) {
        self.vacuum.getConsumableStatus(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                self.vacuum.getCleanSummary(function (err, data2) {
                    if (err) {
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

    this.app.get("/api/get_fw_version", function (req, res) {
        fs.readFile("/etc/os-release", function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                const extractedOsRelease = data.toString().match(WebServer.OS_RELEASE_FW_REGEX);
                if (extractedOsRelease) {
                    const splittedFw = extractedOsRelease[11].split('_');
                    //determine package.json
                    var rootDirectory = path.resolve(__dirname, "../..");
                    var packageContent = fs.readFileSync(rootDirectory + '/package.json');
                    var valetudoVersion = "?"; //Could not read ../package.json
                    if (packageContent) {
                        valetudoVersion = JSON.parse(packageContent).version;
                    }
                    //return result
                    res.json({
                        version: splittedFw[0],
                        build: splittedFw[1],
                        valetudoVersion
                    });
                }
            }
        });
    });

    this.app.get("/api/get_app_locale", function (req, res) {
        self.vacuum.getAppLocale(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.get("/api/wifi_status", function (req, res) {
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
        if (iwOutput) {
            const extractedWifiData = iwOutput.toString().match(WebServer.WIFI_CONNECTED_IW_REGEX);
            if (extractedWifiData) {
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

    this.app.get("/api/timers", function (req, res) {
        self.vacuum.getTimers(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.post("/api/timers", function (req, res) {
        if (req.body && req.body.cron) {
            self.vacuum.addTimer(req.body.cron, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("invalid request");
        }
    });

    this.app.put("/api/timers/:timerID", function (req, res) {
        if (req.body && req.body.enabled !== undefined) {
            self.vacuum.toggleTimer(req.params.timerID, req.body.enabled, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.delete("/api/timers/:timerID", function (req, res) {
        self.vacuum.deleteTimer(req.params.timerID, function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        })
    });

    this.app.get("/api/get_dnd", function (req, res) {
        self.vacuum.getDndTimer(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.post("/api/set_dnd", function (req, res) {
        if (req.body && req.body.start_hour && req.body.start_minute && req.body.end_hour && req.body.end_minute) {
            self.vacuum.setDndTimer(req.body.start_hour, req.body.start_minute, req.body.end_hour, req.body.end_minute, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("invalid request");
        }
    });

    this.app.put("/api/delete_dnd", function (req, res) {
        self.vacuum.deleteDndTimer(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        })
    });

    this.app.get("/api/get_timezone", function (req, res) {
        self.vacuum.getTimezone(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.post("/api/set_timezone", function (req, res) {
        if (req.body && req.body.new_zone) {
            self.vacuum.setTimezone(req.body.new_zone, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("invalid request");
        }
    });

    this.app.get("/api/clean_summary", function (req, res) {
        if (req.body) {
            self.vacuum.getCleanSummary(function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.put("/api/clean_record", function (req, res) {
        if (req.body && req.body.recordId) {
            self.vacuum.getCleanRecord(req.body.recordId, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    //TODO: validate data from robot. Don't just hope that the array contains what we expect
                    //TODO: Maybe move validation to Vacuum.js and trust the data here
                    /*
                     * Positions in array:
                     * 0: startTS(sec)
                     * 1: endTS(sec)
                     * 2: duration(sec)
                     * 3: square-meter
                     * 4: errorCode
                     * 5: finishedFlag
                     */
                    res.json({
                        startTime: data[0][0] * 1000, //convert to ms
                        endTime: data[0][1] * 1000, //convert to ms
                        duration: data[0][2],
                        area: data[0][3],
                        errorCode: data[0][4],
                        errorDescription: self.vacuum.getErrorCodeDescription(data[0][4]),
                        finishedFlag: (data[0][5] === 1)
                    });
                }
            })
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.put("/api/start_cleaning", function (req, res) {
        self.vacuum.getCurrentStatus(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
                return;
            }
            
            if (data.in_cleaning === 2 && data.state === 10) {
                self.vacuum.resumeCleaningZone((err, data) => {
                    if (err) {
                        res.status(500).send(err.toString());
                    } else {
                        res.json(data);
                    }
                });
            } else {
                self.vacuum.startCleaning((err, data) => {
                    if (err) {
                        res.status(500).send(err.toString());
                    } else {
                        res.json(data);
                    }
                });
            }
        });
    });

    this.app.put("/api/pause_cleaning", function (req, res) {
        self.vacuum.pauseCleaning(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/stop_cleaning", function (req, res) {
        self.vacuum.stopCleaning(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/go_to", function (req, res) {
        if (req.body && req.body.x !== undefined && req.body.y !== undefined) {
            self.vacuum.goTo(req.body.x, req.body.y, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    this.app.put("/api/start_cleaning_zone", function (req, res) {
        if (req.body) {
            self.vacuum.startCleaningZone(req.body, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    this.app.get("/api/get_config", function (req, res) {
        res.json(self.configuration.getAll());
    });

    this.app.put("/api/set_config", function (req, res) {
        if (req.body && req.body.config) {

            //TODO: Validate input. Don't just blindly accept arbitrary json
            Object.keys(req.body.config).forEach(function (key) {
                self.configuration.set(key, req.body.config[key]);
            });

            res.sendStatus(200);
        } else {
            res.status(400).send("config missing");
        }
    });

    this.app.put("/api/fanspeed", function (req, res) {
        if (req.body && req.body.speed && req.body.speed <= 105 && req.body.speed >= 0) {
            self.vacuum.setFanSpeed(req.body.speed, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid speed");
        }
    });

    this.app.put("/api/set_sound_volume", function (req, res) {
        if (req.body && req.body.volume && req.body.volume <= 100 && req.body.volume >= 0) {
            self.vacuum.setSoundVolume(req.body.volume, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid sound volume");
        }
    });

    this.app.get("/api/get_sound_volume", function (req, res) {
        self.vacuum.getSoundVolume(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/test_sound_volume", function (req, res) {
        self.vacuum.testSoundVolume(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/wifi_configuration", function (req, res) {
        if (req.body && req.body.ssid && req.body.password) {
            self.vacuum.configureWifi(req.body.ssid, req.body.password, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid wifi configuration");
        }
    });

    this.app.put("/api/reset_consumable", function (req, res) {
        if (req.body && typeof req.body.consumable === "string") {
            self.vacuum.resetConsumable(req.body.consumable, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            })
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.put("/api/find_robot", function (req, res) {
        self.vacuum.findRobot(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/drive_home", function (req, res) {
        self.vacuum.driveHome(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/spot_clean", function (req, res) {
        self.vacuum.spotClean(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });
    this.app.put("/api/start_manual_control", function (req, res) {
        self.vacuum.startManualControl(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/stop_manual_control", function (req, res) {
        self.vacuum.stopManualControl(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/set_manual_control", function (req, res) {
        if (req.body && req.body.angle !== undefined && req.body.velocity !== undefined
            && req.body.duration !== undefined && req.body.sequenceId !== undefined) {
            self.vacuum.setManualControl(req.body.angle, req.body.velocity, req.body.duration, req.body.sequenceId, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
        }
    });

    this.app.get("/api/get_carpet_mode", function (req, res) {
        self.vacuum.getCarpetMode(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/set_carpet_mode", function (req, res) {
        if (req.body && req.body.enable !== undefined && req.body.current_integral !== undefined && req.body.current_low !== undefined
            && req.body.current_high !== undefined && req.body.stall_time !== undefined) {
            self.vacuum.setCarpetMode(req.body.enable, req.body.current_integral, req.body.current_low, req.body.current_high, req.body.stall_time, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
        }
    });

    this.app.get("/api/map/latest", function (req, res) {
        var parsedUrl = url.parse(req.url, true);
        const doNotTransformPath = parsedUrl.query.doNotTransformPath !== undefined;
        Tools.FIND_LATEST_MAP(function (err, data) {
            if (!err) {
                const lines = data.log.split("\n");
                let coords = [];

                lines.forEach(function (line) {
                    if (line.indexOf("reset") !== -1) {
                        coords = [];
                    }
                    if (line.indexOf("estimate") !== -1) {
                        let sl = line.split(" ");
                        let lx = sl[2];
                        let ly = sl[3];
                        if (doNotTransformPath) {
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

    this.app.get("/api/token", function (req, res) {
        res.json({
            token: self.vacuum.token.toString("hex")
        });
    });

    this.app.use(express.static(path.join(__dirname, "../..", 'client')));
    this.app.listen(this.port, function () {
        console.log("Webserver running on port", self.port)
    })
};

//This is the sole reason why I've bought a 21:9 monitor
WebServer.WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;
WebServer.OS_RELEASE_FW_REGEX = /^NAME=(.*)\nVERSION=(.*)\nID=(.*)\nID_LIKE=(.*)\nPRETTY_NAME=(.*)\nVERSION_ID=(.*)\nHOME_URL=(.*)\nSUPPORT_URL=(.*)\nBUG_REPORT_URL=(.*)\n(ROCKROBO|ROBOROCK)_VERSION=(.*)/;

module.exports = WebServer;
