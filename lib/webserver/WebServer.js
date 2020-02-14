
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const spawnSync = require("child_process").spawnSync;
const zlib = require("zlib");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const dynamicMiddleware = require("express-dynamic-middleware");
const basicAuth = require("express-basic-auth");
const multer = require("multer");
const Roborock = require("../devices/Roborock");

const upload = multer({ dest: "/mnt/data/valetudo/uploads" });

/**
 *
 * @param options {object}
 * @param options.vacuum {Roborock} (actually a MiioVacuum, but that's not complete yet)
 * @param options.port {number}
 * @param options.configuration {Configuration}
 * @param options.events {EventEmitter}
 * @param options.map {MapDTO}
 * @param options.sshManager {sshManager}
 * @param options.model {Model}
 * @param options.cloudKey {Buffer} required to sign /gslb responses
 * @constructor
 */
const WebServer = function (options) {
    const self = this;

    this.vacuum = options.vacuum;
    this.port = options.port;
    this.configuration = options.configuration;
    this.events = options.events;
    this.sshManager = options.sshManager;
    this.cloudKey = options.cloudKey;
    this.model = options.model;

    this.map = options.map;

    this.mapUploadInProgress = false;
    this.basicAuthInUse = false;
    this.app = express();
    this.app.use(compression());
    this.app.use(bodyParser.json());

    this.uploadLocation = "/mnt/data/valetudo/uploads";
    fs.readdir(this.uploadLocation, (err, files) => {
        if(!err){ //remove all previous uploads
            for (const file of files) {
                fs.unlink(path.join(this.uploadLocation, file), (rmerr) => {});
            }
        }
    });

    const basicAuthUnauthorizedResponse = function(req) {
        return req.auth ? ("Credentials \"" + req.auth.user + ":" + req.auth.password + "\" rejected") : "No credentials provided";
    };

    const basicAuthMiddleware = basicAuth({authorizer: function(username, password) {
        const userMatches = basicAuth.safeCompare(username, self.configuration.get("httpAuth").username);
        const passwordMatches = basicAuth.safeCompare(password, self.configuration.get("httpAuth").password);
        return userMatches && passwordMatches;
    }, challenge: true, unauthorizedResponse: basicAuthUnauthorizedResponse});

    const authMiddleware = function(req, res, next) {
        if (["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip)) {
            // Allow requests from localhost
            next();
        } else {
            // Authenticate other ones
            try {
                basicAuthMiddleware(req, res, next);
            } catch (e) { /* basicAuth throws [ERR_HTTP_HEADERS_SENT] here if invalid credentials are sent */ }
        }
    };
    const dynamicAuth = dynamicMiddleware.create([]);
    this.app.use(dynamicAuth.handle());

    if (this.configuration.get("httpAuth").enabled) {
        dynamicAuth.use(authMiddleware);
        this.basicAuthInUse = true;
    }

    this.app.put("/api/miio/map_upload_handler", (req, res) => {
        console.debug("map_upload_handler", req.query);
        if(!self.mapUploadInProgress) {
            self.mapUploadInProgress = true;

            var data = [];
            req.on("data", chunk => data.push(chunk));

            req.on("end", () => {
                const uploadedGzippedMapData = Buffer.concat(data);
                // save data for debugging
                // fs.writeFile("/tmp/mapdata", uploadedGzippedMapData, (err) => console.warn(err));
                this.vacuum.preprocessMap(uploadedGzippedMapData, (err, data) => {
                    const dataToHash = data.length > 48 ? data.slice(20, data.length - 29) : data; //strip index,sequence + digest
                    const hashOfNewMap = crypto.createHash("sha1").update(dataToHash).digest("base64");

                    if(hashOfNewMap !== self.map.hash) {
                        if (!err) {
                            const parsedMap = this.vacuum.parseMap(data);

                            self.mapUploadInProgress = false;

                            if (parsedMap !== null) {
                                self.map.parsedData = parsedMap;
                                self.map.hash = hashOfNewMap;

                                self.events.emit("valetudo.map");
                            }
                        } else {
                            self.mapUploadInProgress = false;
                        }
                    } else {
                        self.mapUploadInProgress = false;
                    }
                });
                res.sendStatus(200);
            });
        } else {
            //This prevents valetudo from leaking memory
            res.end();
            req.connection.destroy();
        }
    });

    this.app.get("/api/capabilities", (req, res) => {
        res.json(this.model.getCapabilities());
    });

    this.app.get("/api/current_status", function (req, res) { //TODO: use cloud interface?
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
                    const splittedFw = extractedOsRelease[11].split("_");
                    //determine package.json
                    var rootDirectory = path.resolve(__dirname, "../..");
                    var packageContent = fs.readFileSync(rootDirectory + "/package.json");
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
            });
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
            });
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
        });
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
            });
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
        });
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
            });
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
            });
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
                        startTime: data[0][0] * 1000, // convert to ms
                        endTime: data[0][1] * 1000,   // convert to ms
                        duration: data[0][2],
                        area: data[0][3],
                        errorCode: data[0][4],
                        errorDescription: Roborock.GET_ERROR_CODE_DESCRIPTION(data[0][4]),
                        finishedFlag: (data[0][5] === 1)
                    });
                }
            });
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

    this.app.put("/api/set_lab_status", function (req, res) {
        if (req.body && req.body.lab_status !== undefined) {
            self.vacuum.setLabStatus(req.body.lab_status, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json({message: "ok"});
                }
            });
        } else {
            res.status(400).send("lab_status missing");
        }
    });

    this.app.put("/api/reset_map", function (req, res) {
        self.vacuum.resetMap(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json({message: "ok"});
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
            });
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    this.app.put("/api/start_cleaning_zone_by_coords", function (req, res) {
        if (req.body) {
            self.vacuum.startCleaningZoneByCoords(req.body, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    /* New function with support of current zone cleanup */
    this.app.put("/api/start_cleaning_zone_by_name", function (req, res) {
        if (req.body) {
            self.vacuum.startCleaningZoneByName(req.body, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
        } else {
            res.status(400).send("coordinates missing");
        }
    });

    this.app.get("/api/zones", function (req, res) {
        // Todo: rename areas to zones in config
        const zones = self.configuration.get("areas");

        res.json(zones.map(zone => ({
            name: zone[0],
            coordinates: zone[1]
        })));
    });

    this.app.put("/api/zones", function (req, res) {
        if(req.body && Array.isArray(req.body)) {
            // Todo: Extended validation
            const zones = req.body.map(zone => [
                zone.name,
                zone.coordinates
            ]);
            self.configuration.set("areas", zones);
            res.status(201).json({message: "ok"});
        } else {
            res.status(400).send({message: "bad request body"});
        }
    });

    this.app.get("/api/http_auth_config", function (req, res) {
        res.json({...self.configuration.get("httpAuth"), password: ""});
    });

    this.app.put("/api/http_auth_config", function (req, res) {
        if(req.body && typeof req.body === "object" && typeof req.body.enabled === "boolean" && typeof req.body.username === "string" && typeof req.body.password === "string") {
            let pass = req.body.password;
            if (!pass) {
                // Don't set password to empty string, keep old one
                pass = self.configuration.get("httpAuth").password;
            }
            self.configuration.set("httpAuth", {
                enabled: req.body.enabled,
                username: req.body.username,
                password: pass,
            });
            if (self.basicAuthInUse && !req.body.enabled) {
                dynamicAuth.unuse(authMiddleware);
                self.basicAuthInUse = false;
            } else if (!self.basicAuthInUse && req.body.enabled) {
                dynamicAuth.use(authMiddleware);
                self.basicAuthInUse = true;
            }
            res.status(201).json({message: "ok"});
        } else {
            res.status(400).send({message: "bad request body"});
        }
    });

    this.app.put("/api/persistent_data", function (req, res) {
        if( req.body !== undefined
            && Array.isArray(req.body.virtual_walls)
            && Array.isArray(req.body.no_go_areas)
        ) {
            const persistentData = [
                ...req.body.no_go_areas.map(area => [0, ...area]),
                ...req.body.virtual_walls.map(wall => [1, ...wall])
            ];

            if (self.vacuum.model === "roborock.vacuum.s5") { //TODO: Move these magic strings to somewhere else
                self.vacuum.savePersistentData(persistentData, function(err) {
                    if(err) {
                        res.status(500).json(err);
                    } else {
                        res.status(201).json({message: "ok"});
                    }
                });
            } else {
                res.status(501).send({message: "saving persistentData is supported only on Roborock S50/55"});
            }
        } else {
            res.status(400).send({message: "bad request body. Should look like { \"virtual_walls\": [], \"no_go_areas\": []}"});
        }
    });

    this.app.get("/api/spots", function (req, res) {
        const spots = self.configuration.get("spots");

        res.json(spots.map(spot => ({
            name: spot[0],
            coordinates: [spot[1], spot[2]]
        })));
    });

    this.app.put("/api/spots", function (req, res) {
        if(req.body && Array.isArray(req.body)) {
            // Todo: Extended validation
            const spots = req.body.map(spot => [
                spot.name,
                ...spot.coordinates
            ]);
            self.configuration.set("spots", spots);
            res.status(201).json({message: "ok"});
        } else {
            res.status(400).send({message: "bad request body"});
        }
    });

    this.app.get("/api/get_config", function (req, res) {
        const config = self.configuration.getAll();
        res.json(config);
    });

    this.app.put("/api/fanspeed", function (req, res) {
        if (req.body && req.body.speed && req.body.speed <= 105 && req.body.speed >= 0) {
            self.vacuum.setFanSpeed(req.body.speed, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
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
            });
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

    this.app.put("/api/set_ssh_keys", function (req, res) {
        if (!self.configuration.get("allowSSHKeyUpload")) return res.status(403).send("Forbidden");
        if (req.body && req.body.keys && typeof req.body.keys === "string") {
            self.sshManager.setSSHKeys(req.body.keys, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.get("/api/get_ssh_keys", function (req, res) {
        if (!self.configuration.get("allowSSHKeyUpload")) return res.status(403).send("Forbidden");
        self.sshManager.getSSHKeys(function (err, data) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        });
    });

    this.app.put("/api/ssh_keys_permanently_disable", function (req, res) {
        if (req.body && req.body.confirmation && typeof req.body.confirmation === "string" && req.body.confirmation === "confirm") {
            self.configuration.set("allowSSHKeyUpload", false);
            res.json("success");
        } else {
            res.status(400).send("Invalid request");
        }
    });

    this.app.put("/api/wifi_configuration", function (req, res) {
        if (req.body && req.body.ssid && req.body.password) {
            self.vacuum.configureWifi(req.body.ssid, req.body.password, function (err, data) {
                if (err) {
                    res.status(500).send(err.toString());
                } else {
                    res.json(data);
                }
            });
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
            });
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

    this.app.put("/api/drive_home", function(req, res) {
        self.vacuum.driveHome().then((data) => res.json(data[0]),
            (err) => res.status(500).send(err && err.toString()));
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

    this.app.post("/api/install_voice_pack", upload.single("file"), function (req, res) {
        if(req.file){

            //Remove old uploads
            for (const file of fs.readdirSync(self.uploadLocation)) {
                if(file.endsWith(".pkg"))
                    fs.unlink(path.join(self.uploadLocation, file), rmerr => {});
            }

            var tmpname = path.join(self.uploadLocation, path.basename(req.file.path) + ".pkg");
            fs.rename(req.file.path, tmpname, function (errFs){
                if(errFs){
                    res.status(500).send(errFs.toString());
                    fs.unlink(req.file.path, (delerr) => {});
                }else{
                    var vps = fs.createReadStream(tmpname);
                    var hash = crypto.createHash("md5").setEncoding("hex");

                    hash.on("finish", function() {
                        self.vacuum.installVoicePack("file://" + tmpname, hash.read(), function (err, data) {
                            if (err) {
                                res.status(500).send(err.toString());
                            } else {
                                res.status(200).send(data);
                            }
                        });
                    });

                    vps.pipe(hash);

                    //Remove the file after 2 minutes
                    setTimeout(() => {
                        fs.exists(tmpname, (exists) => {
                            if(exists){
                                fs.unlink(tmpname, (delerr) => {});
                            }
                        });
                    }, 60000);
                }
            });
        }else{
            res.status(400).send("Invalid request");
        }
    });

    // clang-format off
    /*
    Handle viomi load balancing requests:

    GET /gslb?tver=2&id=277962183&dm=ot.io.mi.com&timestamp=1574455630&sign=nNevMcHtzuB90okJfG9zSyPTw87u8U8HQpVNXqpVt%2Bk%3D HTTP/1.1
    Host:110.43.0.83
    User-Agent:miio-client

    {"info":{"host_list":[{"ip":"120.92.65.244","port":8053},{"ip":"120.92.142.94","port":8053},{"ip":"58.83.177.237","port":8053},{"ip":"58.83.177.239","port":8053},{"ip":"58.83.177.236","port":8053},{"ip":"120.92.65.242","port":8053}],"enable":1},"sign":"NxPNmsa8eh2/Y6OdJKoEaEonR6Lvrw5CkV5+mnpZois=","timestamp":"1574455630"}
    */
    // clang-format on
    this.app.get("/gslb", (req, res) => {
        const dummycloudIP = this.configuration.get("dummycloud").spoofedIP;
        const info = {"host_list": [{"ip": dummycloudIP, port: 8053}], "enable": 1};
        const signature = crypto.createHmac("sha256", this.cloudKey)
            .update(JSON.stringify(info))
            .digest("base64");
        res.status(200).send(
            {"info": info, "timestamp": req.query["timestamp"], "sign": signature});
    });

    this.app.get("/api/install_voice_pack_status", function(req, res){
        self.vacuum.getVoicePackInstallationStatus(function(err, data){
            if(err){
                res.status(500).send(err.toString());
            }else{
                res.status(200).send(data[0]);
            }
        });
    });

    this.app.get("/api/map/latest", function (req, res) {
        res.json(self.map.parsedData);
    });

    this.app.get("/api/token", (req, res) => {
        res.json(this.vacuum.getTokens());
    });

    this.app.use(express.static(path.join(__dirname, "../..", "client")));
    const server = http.createServer(this.app);

    const wss = new WebSocket.Server({ server });

    //function to catch alive ws
    function heartbeat() {
        this.isAlive = true;
    }

    function noop() {}

    self.events.on("valetudo.map", () => {
        // don't need to compress anything if all clients are still in progress
        if (!Array.from(wss.clients).some(ws => !ws.mapUploadInProgress)) {
            return;
        }
        // zlib compression on map.parsedData allows to send up to 5x times less data via the network
        zlib.deflate(JSON.stringify(self.map.parsedData), (err, buf) => {
            //Too many connected clients might cause valetudo to go OOM
            //If this is the case, we should limit the amount of concurrent responses
            //However for now, it should be sufficient to just limit the concurrent responses per client to one
            if (!err)
                wss.clients.forEach(function each(ws) {
                    if (!ws.mapUploadInProgress) {
                        ws.mapUploadInProgress = true;

                        ws.send(buf, function () {
                            ws.mapUploadInProgress = false;
                        });
                    }
                });
        });
    });

    setInterval(function () {
        wss.clients.forEach(function each(ws) {
            //terminate inactive ws
            if (ws.isAlive === false) return ws.terminate();

            //mark ws as inactive
            ws.isAlive = false;
            //ask ws to send a pong to be marked as active
            ws.ping(noop);
            ws.send("", noop);
            /**
             * We have to send both, since ping is a browser feature which the client can't see
             * To reconnect the client, we do however need to see if we're still connected
             */
        });
    }, 2000);

    wss.on("connection", (ws) => {
        //set ws as alive
        ws.isAlive = true;
        //attach pong function
        ws.on("pong", heartbeat);

        if (self.map.parsedData) {
            zlib.deflate(JSON.stringify(self.map.parsedData), (err, buf) => {
                if (!err) {
                    ws.send(buf, noop);
                }

            });
        }
    });

    server.listen(this.port, function () {
        console.log("Webserver running on port", self.port);
    });
    this.webserver = server;
};

//This is the sole reason why I've bought a 21:9 monitor
WebServer.WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;
WebServer.OS_RELEASE_FW_REGEX = /^NAME=(.*)\nVERSION=(.*)\nID=(.*)\nID_LIKE=(.*)\nPRETTY_NAME=(.*)\nVERSION_ID=(.*)\nHOME_URL=(.*)\nSUPPORT_URL=(.*)\nBUG_REPORT_URL=(.*)\n(ROCKROBO|ROBOROCK)_VERSION=(.*)/;

/**
 * Shutdown webserver
 * @return {Promise<void>}
 */
WebServer.prototype.shutdown = function() {
    return new Promise((resolve, reject) => {
        console.debug("Webserver shutdown in progress...");

        //closing the server
        this.webserver.close(() => {
            console.debug("Webserver shutdown done");
            resolve();
        });
    });
};

module.exports = WebServer;
