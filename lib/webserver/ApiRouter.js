const os = require("os");
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const spawnSync = require("child_process").spawnSync;
const multer = require("multer");
const Roborock = require("../devices/Roborock");
const Logger = require("../Logger");

const uploadLocation = path.join(os.tmpdir(), "/valetudo/uploads");
const upload = multer({ dest: uploadLocation });

const removeOldUploads = async (extension = null) => {
    try {
        let files = await fs.promises.readdir(uploadLocation);
        for (const file of files) {
            if (extension === null || file.endsWith(extension)) {
                await fs.promises.unlink(path.join(uploadLocation, file));
            }
        }
    } catch (err) {
        Logger.error("Unable to delete old uploads: ", err.toString());
    }
};

/**
 * Api routes used by the webinterface
 *
 * @param {import("./WebServer")} webserver
 * @returns {express.Router}
 */
const ApiRouter = function(webserver) {
    const router = express.Router();
    const model = webserver.model;
    const vacuum = webserver.vacuum;
    const configuration = webserver.configuration;
    const sshManager = webserver.sshManager;

    removeOldUploads();

    router.get("/capabilities", (req, res) => {
        res.json(model.getCapabilities());
    });

    router.get("/current_status", async (req, res) => {
        try {
            let data = await vacuum.getCurrentStatus();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/consumable_status", async (req, res) => {
        try {
            let data = await vacuum.getConsumableStatus();
            let data2 = await vacuum.getCleanSummary();
            res.json({
                consumables: data,
                summary: data2
            });
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/get_fw_version", async (req, res) => {
        try {
            const OS_RELEASE_FW_REGEX = /^NAME=(.*)\nVERSION=(.*)\nID=(.*)\nID_LIKE=(.*)\nPRETTY_NAME=(.*)\nVERSION_ID=(.*)\nHOME_URL=(.*)\nSUPPORT_URL=(.*)\nBUG_REPORT_URL=(.*)\n(ROCKROBO|ROBOROCK)_VERSION=(.*)/;
            let data = await fs.promises.readFile("/etc/os-release");
            const extractedOsRelease = data.toString().match(OS_RELEASE_FW_REGEX);
            if (extractedOsRelease) {
                const splittedFw = extractedOsRelease[11].split("_");
                //determine package.json
                let rootDirectory = path.resolve(__dirname, "../..");
                let packageContent = fs.readFileSync(rootDirectory + "/package.json", {"encoding": "utf-8"});
                let valetudoVersion = "?"; //Could not read ../package.json
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
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/get_app_locale", async (req, res) => {
        try {
            let data = await vacuum.getAppLocale();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/wifi_status", async (req, res) => {
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
            const WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;

            const extractedWifiData = iwOutput.toString().match(WIFI_CONNECTED_IW_REGEX);
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

    router.get("/timers", async (req, res) => {
        try {
            let data = await vacuum.getTimers();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.post("/timers", async (req, res) => {
        try {
            if (req.body && req.body.cron) {
                await vacuum.addTimer(req.body.cron);
                res.sendStatus(200);
            } else {
                res.status(400).send("invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/timers/:timerID", async (req, res) => {
        try {
            if (req.body && req.body.enabled !== undefined) {
                await vacuum.toggleTimer(req.params.timerID, req.body.enabled);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.delete("/timers/:timerID", async (req, res) => {
        try {
            await vacuum.deleteTimer(req.params.timerID);
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/get_dnd", async (req, res) => {
        try {
            let data = await vacuum.getDndTimer();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.post("/set_dnd", async (req, res) => {
        try {
            if (req.body && req.body.start_hour && req.body.start_minute && req.body.end_hour && req.body.end_minute) {
                await vacuum.setDndTimer(parseInt(req.body.start_hour), parseInt(req.body.start_minute), parseInt(req.body.end_hour), parseInt(req.body.end_minute));
                res.sendStatus(200);
            } else {
                res.status(400).send("invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/delete_dnd", async (req, res) => {
        try {
            await vacuum.deleteDndTimer();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }

    });

    router.get("/get_timezone", async (req, res) => {
        try {
            let data = await vacuum.getTimezone();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }

    });

    router.post("/set_timezone", async (req, res) => {
        try {
            if (req.body && req.body.new_zone) {
                await vacuum.setTimezone(req.body.new_zone);
                res.sendStatus(200);
            } else {
                res.status(400).send("invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/clean_summary", async (req, res) => {
        try {
            if (req.body) {
                let data = await vacuum.getCleanSummary();
                res.json(data);
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/clean_record", async (req, res) => {
        try {
            if (req.body && req.body.recordId) {
                let data = await vacuum.getCleanRecord(parseInt(req.body.recordId));
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
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }

    });

    router.put("/start_cleaning", async (req, res) => {
        try {
            let data = await vacuum.getCurrentStatus();
            if (data.in_cleaning === 2 && data.state === "PAUSED") {
                await vacuum.resumeCleaningZone();
            } else {
                await vacuum.startCleaning();
            }
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/pause_cleaning", async (req, res) => {
        try {
            await vacuum.pauseCleaning();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/stop_cleaning", async (req, res) => {
        try {
            await vacuum.stopCleaning();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/set_lab_status", async (req, res) => {
        try {
            if (req.body && req.body.lab_status !== undefined) {
                await vacuum.setLabStatus(req.body.lab_status);
                res.sendStatus(200);
            } else {
                res.status(400).send("lab_status missing");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/reset_map", async (req, res) => {
        try {
            await vacuum.resetMap();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/go_to", async (req, res) => {
        try {
            if (req.body && req.body.x !== undefined && req.body.y !== undefined) {
                await vacuum.goTo(req.body.x, req.body.y);
                res.sendStatus(200);
            } else {
                res.status(400).send("coordinates missing");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/start_cleaning_zone_by_coords", async (req, res) => {
        try {
            if (req.body) {
                await vacuum.startCleaningZoneByCoords(req.body);
                res.sendStatus(200);
            } else {
                res.status(400).send("coordinates missing");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    /* New function with support of current zone cleanup */
    router.put("/start_cleaning_zones_by_id", async (req, res) => {
        try {
            if (req.body) {
                await vacuum.startCleaningZonesById(req.body);
                res.sendStatus(200);
            } else {
                res.status(400).send("coordinates missing");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/zones", async (req, res) => {
        const zones = [...configuration.getZones().values()];
        res.json(zones);
    });

    router.put("/zones", async (req, res) => {
        if (req.body && Array.isArray(req.body)) {
            // Todo: Extended validation
            const zones = configuration.getZones();
            const found = new Set();
            req.body.map(zone => {
                const oldZone = zones.get(zone.id);
                if (oldZone) {
                    Object.assign(oldZone, zone);
                } else {
                    zones.set(zone.id, zone);
                }
                found.add(zone.id);
            });
            zones.forEach((v, k) => {
                if (!found.has(k) && v.user) {
                    zones.delete(k);
                }
            });
            configuration.setZones(zones);
            res.sendStatus(201);
        } else {
            res.status(400).send("bad request body");
        }
    });

    router.get("/http_auth_config", async (req, res) => {
        res.json({...configuration.get("httpAuth"), password: ""});
    });

    router.put("/http_auth_config", async (req, res) => {
        if (req.body && typeof req.body === "object" && typeof req.body.enabled === "boolean" && typeof req.body.username === "string" && typeof req.body.password === "string") {
            webserver.setBasicAuth(req.body.enabled, req.body.username, req.body.password);
            res.sendStatus(201);
        } else {
            res.status(400).send("bad request body");
        }
    });

    router.put("/persistent_data", async (req, res) => {
        try {
            if ( req.body !== undefined
                && Array.isArray(req.body.virtual_walls)
                && Array.isArray(req.body.no_go_areas)
            ) {
                const persistentData = [
                    ...req.body.no_go_areas.map(area => [0, ...area]),
                    ...req.body.virtual_walls.map(wall => [1, ...wall])
                ];

                if (model.RoborockApi) {
                    await vacuum.savePersistentData(persistentData);
                    res.sendStatus(201);
                } else {
                    res.status(501).send("saving persistentData is supported only on Roborock S50/55");
                }
            } else {
                res.status(400).send("bad request body. Should look like { \"virtual_walls\": [], \"no_go_areas\": []}");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/spots", async (req, res) => {
        const spots = configuration.get("spots");

        res.json(spots.map(spot => ({
            name: spot[0],
            coordinates: [spot[1], spot[2]]
        })));
    });

    router.put("/spots", async (req, res) => {
        if (req.body && Array.isArray(req.body)) {
            // Todo: Extended validation
            const spots = req.body.map(spot => [
                spot.name,
                ...spot.coordinates
            ]);
            configuration.set("spots", spots);
            res.sendStatus(201);
        } else {
            res.status(400).send("bad request body");
        }
    });

    router.get("/get_config", async (req, res) => {
        const config = configuration.getAll();
        res.json(config);
    });

    router.get("/fanspeeds", async (req, res) => {
        try {
            res.json(await vacuum.getFanSpeeds());
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/fanspeed", async (req, res) => {
        try {
            if (req.body && req.body.speed) {
                await vacuum.setFanSpeed(req.body.speed);
                res.sendStatus(200);
            } else {
                res.status(400).send("speed missing");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/set_sound_volume", async (req, res) => {
        try {
            if (req.body && req.body.volume && req.body.volume <= 100 && req.body.volume >= 0) {
                await vacuum.setSoundVolume(req.body.volume);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid sound volume");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/get_sound_volume", async (req, res) => {
        try {
            let data = await vacuum.getSoundVolume();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/test_sound_volume", async (req, res) => {
        try {
            await vacuum.testSoundVolume();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/set_ssh_keys", async (req, res) => {
        try {
            if (!configuration.get("allowSSHKeyUpload")) return res.status(403).send("Forbidden");
            if (req.body && req.body.keys && typeof req.body.keys === "string") {
                await sshManager.setSSHKeys(req.body.keys);
                res.json("success");
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/get_ssh_keys", async (req, res) => {
        try {
            if (!configuration.get("allowSSHKeyUpload")) return res.status(403).send("Forbidden");
            let data = await sshManager.getSSHKeys();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }

    });

    router.put("/ssh_keys_permanently_disable", async (req, res) => {
        try {
            if (req.body && req.body.confirmation && typeof req.body.confirmation === "string" && req.body.confirmation === "confirm") {
                await configuration.set("allowSSHKeyUpload", false);
                res.json("success");
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/wifi_configuration", async (req, res) => {
        try {
            if (req.body && req.body.ssid && req.body.password) {
                await vacuum.configureWifi(req.body.ssid, req.body.password);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid wifi configuration");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/reset_consumable", async (req, res) => {
        try {
            if (req.body && typeof req.body.consumable === "string") {
                await vacuum.resetConsumable(req.body.consumable);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/find_robot", async (req, res) => {
        try {
            await vacuum.findRobot();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/drive_home", async (req, res) => {
        try {
            await vacuum.driveHome();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/spot_clean", async (req, res) => {
        try {
            await vacuum.spotClean();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/start_manual_control", async (req, res) => {
        try {
            await vacuum.startManualControl();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/stop_manual_control", async (req, res) => {
        try {
            await vacuum.stopManualControl();
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/set_manual_control", async (req, res) => {
        try {
            if (req.body && req.body.angle !== undefined && req.body.velocity !== undefined
                && req.body.duration !== undefined && req.body.sequenceId !== undefined) {
                await vacuum.setManualControl(req.body.angle, req.body.velocity, req.body.duration, req.body.sequenceId);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.get("/get_carpet_mode", async (req, res) => {
        try {
            let data = await vacuum.getCarpetMode();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.put("/set_carpet_mode", async (req, res) => {
        try {
            if (req.body && req.body.enable !== undefined && req.body.current_integral !== undefined && req.body.current_low !== undefined
                && req.body.current_high !== undefined && req.body.stall_time !== undefined) {
                await vacuum.setCarpetMode(req.body.enable, req.body.current_integral, req.body.current_low, req.body.current_high, req.body.stall_time);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid request");
            }
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });

    router.post("/install_voice_pack", upload.single("file"), async (req, res) => {
        if (req.file){

            removeOldUploads(".pkg");

            var tmpname = path.join(uploadLocation, path.basename(req.file.path) + ".pkg");
            fs.rename(req.file.path, tmpname, function (errFs){
                if (errFs){
                    res.status(500).send(errFs.toString());
                    fs.unlink(req.file.path, (delerr) => {});
                } else {
                    var vps = fs.createReadStream(tmpname);
                    var hash = crypto.createHash("md5").setEncoding("hex");

                    hash.on("finish", function() {
                        vacuum.installVoicePack("file://" + tmpname, hash.read())
                            .then(data => {
                                res.status(200).send(data);
                            })
                            .catch(err => {
                                res.status(500).send(err.toString());
                            });
                    });

                    vps.pipe(hash);

                    //Remove the file after 2 minutes
                    setTimeout(() => {
                        fs.exists(tmpname, (exists) => {
                            if (exists){
                                fs.unlink(tmpname, (delerr) => {});
                            }
                        });
                    }, 60000);
                }
            });
        } else {
            res.status(400).send("Invalid request");
        }
    });

    router.get("/install_voice_pack_status", async (req, res) => {
        try {
            let data = await vacuum.getVoicePackInstallationStatus();
            res.json(data);
        } catch (err) {
            res.status(500).send(err.toString());
        }

    });

    router.get("/map/latest", async (req, res) => {
        res.json(webserver.map.parsedData);
    });

    router.get("/token", async (req, res) => {
        res.json(vacuum.getTokens());
    });

    router.get("/mqtt_config", async (req, res) => {
        res.json(configuration.get("mqtt"));
    });

    router.put("/mqtt_config", async (req, res) => {
        configuration.set("mqtt", req.body);
        res.sendStatus(202);
    });

    return router;
};

module.exports = ApiRouter;
