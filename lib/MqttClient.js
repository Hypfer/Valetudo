const fs = require("fs");
const mqtt = require("mqtt");
const Tools = require("./Tools");
const Vacuum = require("./miio/Vacuum");

const MQTT_COMMANDS = {
    START: "start",
    RETURN_TO_BASE: "return_to_base",
    STOP: "stop",
    CLEAN_SPOT: "clean_spot",
    LOCATE: "locate",
    PAUSE: "pause"
};

const CUSTOM_COMMANDS = {
    GO_TO: "go_to",
    ZONED_CLEANUP: "zoned_cleanup"
};

//TODO: since this is also displayed in the UI it should be moved somewhere else
const FAN_SPEEDS = {
    min: 38,
    medium: 60,
    high: 75,
    max: 100,
    mop: 105
};

const MQTT_STATES = {
    CLEANING: "cleaning",
    PAUSED: "paused",
    IDLE: "idle",
    RETURNING: "returning",
    DOCKED: "docked",
    ERROR: "error",
    ZONE_CLEANUP: "cleaning"
};

const MQTT_STATE_MAPPINGS = {
    2: MQTT_STATES.IDLE,
    3: MQTT_STATES.IDLE,
    5: MQTT_STATES.CLEANING,
    7: MQTT_STATES.CLEANING,
    11: MQTT_STATES.CLEANING,
    16: MQTT_STATES.CLEANING,
    17: MQTT_STATES.ZONE_CLEANUP,
    6: MQTT_STATES.RETURNING,
    15: MQTT_STATES.RETURNING,
    8: MQTT_STATES.DOCKED,
    9: MQTT_STATES.ERROR,
    12: MQTT_STATES.ERROR,
    10: MQTT_STATES.PAUSED
};

/**
 *
 * @param options {object}
 * @param options.configuration {Configuration}
 * @param options.vacuum {Vacuum}
 * @param options.events {EventEmitter}
 * @param options.map {MapDTO}
 * @constructor
 */
const MqttClient = function (options) {
    this.configuration = options.configuration;
    this.vacuum = options.vacuum;

    let mqttConfig = this.configuration.get("mqtt");

    this.brokerURL = mqttConfig.broker_url;
    this.identifier = mqttConfig.identifier || "rockrobo";
    this.topicPrefix = mqttConfig.topicPrefix || "valetudo";
    this.autoconfPrefix = mqttConfig.autoconfPrefix || "homeassistant";
    this.attributesUpdateInterval = mqttConfig.attributesUpdateInterval || 60000;
    this.provideMapData = mqttConfig.provideMapData !== undefined || true;
    this.caPath = mqttConfig.caPath || "";
    this.events = options.events;
    this.map = options.map;

    this.topics = {
        command: this.topicPrefix + "/" + this.identifier + "/command",
        set_fan_speed: this.topicPrefix + "/" + this.identifier + "/set_fan_speed",
        send_command: this.topicPrefix + "/" + this.identifier + "/custom_command",
        state: this.topicPrefix + "/" + this.identifier + "/state",
        map_data: this.topicPrefix + "/" + this.identifier + "/map_data",
        attributes: this.topicPrefix + "/" + this.identifier + "/attributes",
        homeassistant_autoconf_vacuum: this.autoconfPrefix + "/vacuum/" + this.topicPrefix + "_" + this.identifier + "/config",
    };

    this.autoconf_payloads = {
        vacuum: {
            name: this.identifier,
            schema: "state",
            supported_features: [
                "start",
                "pause",
                "stop",
                "return_home",
                "battery",
                "status",
                "locate",
                "clean_spot",
                "fan_speed",
                "send_command"
            ],
            command_topic: this.topics.command,
            state_topic: this.topics.state,
            set_fan_speed_topic: this.topics.set_fan_speed,
            fan_speed_list: Object.keys(FAN_SPEEDS),
            send_command_topic: this.topics.send_command,
            json_attributes_topic: this.topics.attributes
        }
    };

    this.last_state = MQTT_STATES.IDLE;


    this.connect();
    this.updateAttributesTopic();


    this.events.on("valetudo.map", () => {
        this.updateMapDataTopic(this.map);
    });

    this.events.on("miio.status", (statusData) => {
        this.updateStatusTopic(statusData);
        this.updateAttributesTopicOnEvent(statusData)
    })
};

MqttClient.prototype.connect = function () {
    if (!this.client || (this.client && this.client.connected === false && this.client.reconnecting === false)) {
        const options = {};
        if (this.caPath) {
            options.ca = fs.readFileSync(this.caPath);
        }
        this.client = mqtt.connect(this.brokerURL, options);

        this.client.on("connect", () => {
            console.info("Connected successfully to mqtt server");
            this.client.subscribe([
                this.topics.command,
                this.topics.set_fan_speed,
                this.topics.send_command
            ], err => {
                if (!err) {
                    this.client.publish(this.topics.homeassistant_autoconf_vacuum, JSON.stringify(this.autoconf_payloads.vacuum), {
                        retain: true
                    });
                } else {
                    //TODO: needs more error handling
                    console.error(err);
                }
            });
        });

        this.client.on("message", (topic, message) => {
            message = message.toString();
            switch (topic) {
                case this.topics.send_command:
                    this.handleCustomCommand(message);
                    break;
                case this.topics.set_fan_speed:
                    this.handleFanSpeedRequest(message);
                    break;
                case this.topics.command:
                    this.handleCommand(message);
                    break;
            }
        })
    }
};


/**
 *
 * @param mapDTO {MapDTO}
 */
MqttClient.prototype.updateMapDataTopic = function (mapDTO) {
    if (this.client && this.client.connected === true && mapDTO && mapDTO.parsedData) {
        this.client.publish(this.topics.map_data, JSON.stringify(mapDTO.parsedData), {retain: true});
    }
};

MqttClient.prototype.updateAttributesTopicOnEvent = function (statusData) {
    this.last_state = MQTT_STATE_MAPPINGS[statusData.state];

    this.client.publish(this.topics.attributes, JSON.stringify({state: this.last_state}), {retain: true});
};


MqttClient.prototype.updateAttributesTopic = function () {
    if (this.attributesUpdateTimeout) {
        clearTimeout(this.attributesUpdateTimeout);
    }

    if (this.client && this.client.connected === true) {
        this.vacuum.getConsumableStatus((err, res) => {
            if (!err) {
                var response = {};

                this.vacuum.getCleanSummary((err, res2) => {
                    if (!err) {
                        response.cleanTime = (res2[0] / 60 / 60).toFixed(1);
                        response.cleanArea = (res2[1] / 1000000).toFixed(1);
                        response.cleanCount = res2[2];
                        var last_runs = res2[3];
                        if (last_runs.length > 0) {
                            this.vacuum.getCleanRecord(last_runs[0], (err, data) => {
                                if (err == null) {
                                    this.last_run_stats = {
                                        startTime: data[0][0] * 1000, //convert to ms
                                        endTime: data[0][1] * 1000, //convert to ms
                                        duration: data[0][2],
                                        area: (data[0][3] / 1000000).toFixed(1),
                                        errorCode: data[0][4],
                                        errorDescription: Vacuum.GET_ERROR_CODE_DESCRIPTION(data[0][4]),
                                        finishedFlag: (data[0][5] === 1)
                                    };
                                } else {
                                    //TODO: needs more error handling
                                    console.error(err);
                                }
                            });
                        }
                        response.last_run_stats = this.last_run_stats ? this.last_run_stats : {};
                        response.mainBrush = (Math.max(0, 300 - (res.main_brush_work_time / 60 / 60))).toFixed(1);
                        response.sideBrush = (Math.max(0, 200 - (res.side_brush_work_time / 60 / 60))).toFixed(1);
                        response.filter = (Math.max(0, 150 - (res.filter_work_time / 60 / 60))).toFixed(1);
                        response.sensor = (Math.max(0, 30 - (res.sensor_dirty_time / 60 / 60))).toFixed(1);
                        response.state = this.last_state;


                        this.client.publish(this.topics.attributes, JSON.stringify(response), {retain: true});

                        this.attributesUpdateTimeout = setTimeout(() => {
                            this.updateAttributesTopic()
                        }, this.attributesUpdateInterval);
                    } else {
                        console.error(err);
                        this.attributesUpdateTimeout = setTimeout(() => {
                            this.updateAttributesTopic()
                        }, this.attributesUpdateInterval);
                    }
                });
            } else {
                console.error(err);
                this.attributesUpdateTimeout = setTimeout(() => {
                    this.updateAttributesTopic()
                }, this.attributesUpdateInterval);
            }
        })
    } else {
        this.attributesUpdateTimeout = setTimeout(() => {
            this.updateAttributesTopic()
        }, this.attributesUpdateInterval);
    }
};

MqttClient.prototype.updateStatusTopic = function (statusData) {
    if (this.client && this.client.connected === true && statusData.battery !== undefined) {
        var response = {};
        response.state = MQTT_STATE_MAPPINGS[statusData.state];
        response.battery_level = statusData.battery;
        response.fan_speed = Object.keys(FAN_SPEEDS).find(key => FAN_SPEEDS[key] === statusData.fan_power);

        if (statusData.error_code !== undefined && statusData.error_code !== 0) {
            response.error = Vacuum.GET_ERROR_CODE_DESCRIPTION(statusData.error_code);
        }

        this.client.publish(this.topics.state, JSON.stringify(response), {retain: true});
    }
};

MqttClient.prototype.handleFanSpeedRequest = function (speed) {
    this.vacuum.setFanSpeed(FAN_SPEEDS[speed], () => {
    });
};

/**
 * @param command {string}
 */
MqttClient.prototype.handleCommand = function (command) {
    switch (command) { //TODO: error handling
        case MQTT_COMMANDS.START:
            this.vacuum.getCurrentStatus((err, res) => {
                if (!err) {
                    if (res.in_cleaning === 2 && MQTT_STATE_MAPPINGS[res.state] === MQTT_STATES.PAUSED) {
                        this.vacuum.resumeCleaningZone(() => {
                        });
                    } else {
                        this.vacuum.startCleaning(() => {
                        });
                    }
                }
            });
            break;
        case MQTT_COMMANDS.STOP:
            this.vacuum.stopCleaning(() => {
            });
            break;
        case MQTT_COMMANDS.RETURN_TO_BASE:
            this.vacuum.stopCleaning(() => {
                this.vacuum.driveHome(() => {
                });
            });
            break;
        case MQTT_COMMANDS.CLEAN_SPOT:
            this.vacuum.spotClean(() => {
            });
            break;
        case MQTT_COMMANDS.LOCATE:
            this.vacuum.findRobot(() => {
            });
            break;
        case MQTT_COMMANDS.PAUSE:
            this.vacuum.pauseCleaning(() => {
            });
            break;
    }
};

/**
 * Expects a stringified JSON payload
 * Must contain a field named "command"
 *
 * @param message
 */
MqttClient.prototype.handleCustomCommand = function (message) {
    let msg;

    try {
        msg = JSON.parse(message);
    } catch (e) {
        console.error(e);
    }

    if (msg && msg.command) {
        switch (msg.command) {
            /**
             * {
             *   "command": "zoned_cleanup",
             *   "zone_ids": [
             *     "Foobar",
             *     "Baz"
             *   ]
             * }
             */
            case CUSTOM_COMMANDS.ZONED_CLEANUP:
                if (Array.isArray(msg.zone_ids)) {
                    const areas = this.configuration.get("areas");
                    let zones = [];

                    msg.zone_ids.forEach(function (zone_id) {
                        let area = areas.find(e => Array.isArray(e) && e[0] === zone_id);
                        if (area && Array.isArray(area[1])) {
                            area[1].forEach(function (zone) {
                                zones.push(zone);
                            });
                        }
                    });

                    if (zones.length) {
                        this.vacuum.startCleaningZone(zones, (err) => {
                            console.error(err);
                        });
                    } else {
                        console.info("Invalid zone_ids");
                    }
                } else {
                    console.info("Missing zone_ids");
                }
                break;
            /**
             * {
             *   "command": "go_to",
             *   "spot_id": "Somewhere"
             * }
             */
            case CUSTOM_COMMANDS.GO_TO:
                if (msg.spot_id) {
                    const spots = this.configuration.get("spots");
                    const spot_coords = spots.find(e => Array.isArray(e) && e[0] === msg.spot_id);

                    if (spot_coords) {
                        this.vacuum.goTo(spot_coords[1], spot_coords[2], () => {
                        });
                    } else {
                        console.info("Invalid spot_id");
                    }
                } else {
                    console.info("Missing spot_id");
                }
                break;
            default:
                console.info("Received invalid custom command", msg.command, msg);
        }
    }
};

module.exports = MqttClient;
