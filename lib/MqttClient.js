const fs = require("fs");
const mqtt = require("mqtt");
const Tools = require("./Tools");
const Vacuum = require("./miio/Vacuum");

const COMMANDS = {
    turn_on: "turn_on",
    return_to_base: "return_to_base",
    stop: "stop",
    clean_spot: "clean_spot",
    locate: "locate",
    start_pause: "start_pause",
    set_fan_speed: "set_fan_speed"
};

//TODO: since this is also displayed in the UI it should be moved somewhere else
const FAN_SPEEDS = {
    min: 38,
    medium: 60,
    high: 75,
    max: 100
};



/**
 *
 * @param options {object}
 * @param options.vacuum {Vacuum}
 * @param options.brokerURL {string}
 * @param options.identifier {string}
 * @param options.topicPrefix {string}
 * @param options.autoconfPrefix {string}
 * @param options.attributesUpdateInterval {number}
 * @param options.provideMapData {boolean}
 * @param options.events {EventEmitter}
 * @constructor
 */
const MqttClient = function(options) {
    this.vacuum = options.vacuum;
    this.brokerURL = options.brokerURL;
    this.identifier = options.identifier || "rockrobo";
    this.topicPrefix = options.topicPrefix || "valetudo";
    this.autoconfPrefix = options.autoconfPrefix || "homeassistant";
    this.attributesUpdateInterval = options.attributesUpdateInterval || 60000;
    this.provideMapData = options.provideMapData !== undefined || true;
    this.caPath = options.caPath || "";
    this.events = options.events;

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
            supported_features: [
                "turn_on",
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
            battery_level_topic: this.topics.state,
            battery_level_template: "{{ value_json.battery_level }}",
            charging_topic: this.topics.state,
            charging_template: "{{value_json.charging}}",
            cleaning_topic: this.topics.state,
            cleaning_template: "{{value_json.cleaning}}",
            docked_topic: this.topics.state,
            docked_template: "{{value_json.docked}}",
            error_topic: this.topics.state,
            error_template: "{{value_json.error}}",
            fan_speed_topic: this.topics.state,
            fan_speed_template: "{{ value_json.fan_speed }}",
            set_fan_speed_topic: this.topics.set_fan_speed,
            fan_speed_list: [
                "min",
                "medium",
                "high",
                "max"
            ],
            send_command_topic: this.topics.send_command,
            json_attributes_topic: this.topics.attributes
        }
    };

    this.connect();
    this.updateAttributesTopic();
    this.events.on("valetudo.map", (mapDTO) => {
        this.updateMapDataTopic(mapDTO);
    });

    this.events.on("miio.status", (statusData) => {
        this.updateStatusTopic(statusData)
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
            this.client.subscribe([
                this.topics.command,
                this.topics.set_fan_speed
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
            this.handleCommand(topic, message.toString());
        })
    }
};


/**
 *
 * @param mapDTO {MapDTO}
 */
MqttClient.prototype.updateMapDataTopic = function(mapDTO) {
    if(mapDTO && mapDTO.parsedData) {
        this.client.publish(this.topics.map_data, JSON.stringify(mapDTO.parsedData), {retain: true});
    }
};


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

        response.battery_level = statusData.battery;
        response.docked = [8,14].indexOf(statusData.state) !== -1;
        response.cleaning = statusData.in_cleaning === 1;
        response.charging = statusData.state === 8;

        switch(statusData.fan_power) {
            case FAN_SPEEDS.min:
                response.fan_speed = "min";
                break;
            case FAN_SPEEDS.medium:
                response.fan_speed = "medium";
                break;
            case FAN_SPEEDS.high:
                response.fan_speed = "high";
                break;
            case FAN_SPEEDS.max:
                response.fan_speed = "max";
                break;
            default:
                response.fan_speed = statusData.fan_power;
        }

        if(statusData.error_code !== undefined && statusData.error_code !== 0) {
            response.error = Vacuum.GET_ERROR_CODE_DESCRIPTION(statusData.error_code);
        }

        this.client.publish(this.topics.state, JSON.stringify(response), {retain: true});
    }
};

/**
 * @param topic {string}
 * @param command {string}
 */
MqttClient.prototype.handleCommand = function(topic, command) {
    var param;
    if(topic === this.topics.set_fan_speed) {
        param = command;
        command = COMMANDS.set_fan_speed;
    }

    switch(command) { //TODO: error handling
        case COMMANDS.turn_on:
            this.vacuum.startCleaning(() => {
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
        case COMMANDS.start_pause:
            this.vacuum.getCurrentStatus((err, res) => {
                if(!err) {
                    if(res.in_cleaning === 1 && [5,11,17].indexOf(res.state) !== -1) {
                        this.vacuum.pauseCleaning(() => {});
                    } else if(res.in_cleaning === 2 && res.state === 10) {
                        this.vacuum.resumeCleaningZone(() => {});
                    } else {
                        this.vacuum.startCleaning(() => {});
                    }
                }
            });
            break;
        case COMMANDS.set_fan_speed:
            this.vacuum.setFanSpeed(FAN_SPEEDS[param], () => {
            });
            break;
        default:
    }

};

module.exports = MqttClient;
