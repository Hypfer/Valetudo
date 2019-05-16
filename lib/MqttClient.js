const fs = require("fs");
const mqtt = require("mqtt");
const Tools = require("./Tools");
const Vacuum = require("./miio/Vacuum");

const COMMANDS = {
    start: "start",
    return_to_base: "return_to_base",
    stop: "stop",
    clean_spot: "clean_spot",
    locate: "locate",
    pause: "pause",
    set_fan_speed: "set_fan_speed"
};

//TODO: since this is also displayed in the UI it should be moved somewhere else
const FAN_SPEEDS = {
    min: 38,
    medium: 60,
    high: 75,
    max: 100,
    mop: 105
};

const CLEANING = "cleaning"
const PAUSED = "paused"
const IDLE = "idle"
const RETURNING = "returning"
const DOCKED = "docked"
const ERROR = "error"
const ZONE_CLEANUP = "zone cleanup"

const STATE_TO_STRING = {
    2: IDLE,
    3: IDLE,
    5: CLEANING,
    7: CLEANING,
    11: CLEANING,
    16: CLEANING,
    17: CLEANING,
    6: RETURNING,
    15: RETURNING,
    8: DOCKED,
    9: ERROR,
    12: ERROR,
    10: PAUSED
}

const FAN_SPEED_TO_STRING = {
    38: "min",
    60: "medium",
    75: "high",
    100:"max",
    105:"mop"
}

/**
 *
 * @param options {object}
 * @param options.configuration {Configuration}
 * @param options.vacuum {Vacuum}
 * @param options.events {EventEmitter}
 * @param options.map {MapDTO}
 * @constructor
 */
const MqttClient = function(options) {
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

    this.connect();
    this.last_state = IDLE
    this.updateAttributesTopic();
    this.events.on("valetudo.map", () => {
        this.updateMapDataTopic(this.map);
    });

    this.events.on("miio.status", (statusData) => {
        this.updateStatusTopic(statusData)
        this.updateAttributesTopicOnEvent(statusData)
    })
};

MqttClient.prototype.connect = function() {
    if(!this.client || (this.client && this.client.connected === false && this.client.reconnecting === false)) {
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
                if(!err) {
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
            switch(topic) {
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
MqttClient.prototype.updateMapDataTopic = function(mapDTO) {
    if(this.client && this.client.connected === true && mapDTO && mapDTO.parsedData) {
        this.client.publish(this.topics.map_data, JSON.stringify(mapDTO.parsedData), {retain: true});
    }
};

MqttClient.prototype.updateAttributesTopicOnEvent = function (statusData) {
    var response = this.lastAttributesResult ? JSON.parse(this.lastAttributesResult) : {};
    response.state = STATE_TO_STRING[statusData.state] == CLEANING && statusData.in_cleaning == 2 ? ZONE_CLEANUP : STATE_TO_STRING[statusData.state];
    const attributeResult = JSON.stringify(response);
    if (!this.lastAttributesResult || attributeResult !== this.lastAttributesResult) {
        this.lastAttributesResult = attributeResult;
        this.client.publish(this.topics.attributes, attributeResult, { retain: true });
    }
    this.last_state = response.state
}


MqttClient.prototype.updateAttributesTopic = function() {
    if(this.attributesUpdateTimeout) {
        clearTimeout(this.attributesUpdateTimeout);
    }

    if(this.client && this.client.connected === true) {
        this.vacuum.getConsumableStatus((err, res) => {
            if(!err) {
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
                        response.sensor =(Math.max(0, 30 - (res.sensor_dirty_time / 60 / 60))).toFixed(1);
                        response.state = this.last_state
                        const attributeResult = JSON.stringify(response);

                        if (!this.lastAttributesResult || attributeResult !== this.lastAttributesResult) {
                            this.lastAttributesResult = attributeResult;
                            this.client.publish(this.topics.attributes, attributeResult, {retain: true});
                        }

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

MqttClient.prototype.updateStatusTopic = function(statusData) {
    if(this.client && this.client.connected === true && statusData.battery !== undefined) {
        var response = {};
        response.state = STATE_TO_STRING[statusData.state]
        response.battery_level = statusData.battery;
        response.fan_speed = FAN_SPEED_TO_STRING[statusData.fan_power]

        if(statusData.error_code !== undefined && statusData.error_code !== 0) {
            response.error = Vacuum.GET_ERROR_CODE_DESCRIPTION(statusData.error_code);
        }

        this.client.publish(this.topics.state, JSON.stringify(response), {retain: true});
    }
};

MqttClient.prototype.handleFanSpeedRequest = function(speed) {
    this.vacuum.setFanSpeed(FAN_SPEEDS[speed], () => {
    });
};

/**
 * @param command {string}
 */
MqttClient.prototype.handleCommand = function(command) {
    switch(command) { //TODO: error handling
        case COMMANDS.start:
            this.vacuum.getCurrentStatus((err, res) => {
                if (!err) {
                    if (res.in_cleaning === 2 && STATE_TO_STRING[res.state] == PAUSED) {
                        this.vacuum.resumeCleaningZone(() => { });
                    } else {
                        this.vacuum.startCleaning(() => { });
                    }
                }
            });
            break;
        case COMMANDS.stop:
            this.vacuum.stopCleaning(() => {
            });
            break;
        case COMMANDS.return_to_base:
            this.vacuum.stopCleaning(() => {
                this.vacuum.driveHome(() => {
                });
            });
            break;
        case COMMANDS.clean_spot:
            this.vacuum.spotClean(() => {
            });
            break;
        case COMMANDS.locate:
            this.vacuum.findRobot(() => {
            });
            break;
        case COMMANDS.pause:
            this.vacuum.pauseCleaning(() => {
            });
            break;
    }
};

MqttClient.prototype.handleCustomCommand = function(message) {
    let msg;

    try {
        msg = JSON.parse(message);
    } catch(e) {
        console.error(e);
    }

    if(msg && msg.command) {
        switch(msg.command) {
            case "zoned_cleanup":
                if(msg.zone_ids && Array.isArray(msg.zone_ids)) {
                    const areas = this.configuration.get("areas");
                    let zones = new Array();
                    msg.zone_ids.forEach(function(zone_id) {
                        let area = areas.find(e => Array.isArray(e) && e[0] === zone_id);
                        if (area && Array.isArray(area[1])) {
                            area[1].forEach(function(zone) {
                                zones.push(zone);
                            });
                        }
                    });
                    
                    if(zones.length) {
                        this.vacuum.startCleaningZone(zones, () => {});
                    }
                } else if (msg.zones) {
                    //TODO: validation
                    this.vacuum.startCleaningZone(msg.zones, () => {})
                }
                break;
            case "go_to":
                if(msg.spot_id) {
                    const spots = this.configuration.get("spots");
                    const spot_coords = spots.find(e => Array.isArray(e) && e[0] === msg.spot_id);

                    if(spot_coords) {
                        this.vacuum.goTo(spot_coords[1], spot_coords[2], () => {});
                    }
                } else if (Array.isArray(msg.spot_coords) && msg.spot_coords.length === 2) {
                    //TODO: validation
                    this.vacuum.goTo(msg.spot_coords[0], msg.spot_coords[1], () => {});
                }
                break;
        }
    }
};

module.exports = MqttClient;
