const mqtt = require("mqtt");
const Tools = require("./Tools");


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
 * @param options.mapSettings {object}
 * @param options.mapUpdateInterval {number}
 * @param options.stateUpdateInterval {number}
 * @param options.attributesUpdateInterval {number}
 * @constructor
 */
const MqttClient = function(options) {
    this.vacuum = options.vacuum;
    this.brokerURL = options.brokerURL;
    this.identifier = options.identifier || "rockrobo";
    this.topicPrefix = options.topicPrefix || "valetudo";
    this.autoconfPrefix = options.autoconfPrefix || "homeassistant";
    this.mapSettings = options.mapSettings || {};
    this.mapUpdateInterval = options.mapUpdateInterval || 30000;
    this.stateUpdateInterval = options.stateUpdateInterval || 10000;
    this.attributesUpdateInterval = options.attributesUpdateInterval || 60000;

    this.topics = {
        command: this.topicPrefix + "/" + this.identifier + "/command",
        set_fan_speed: this.topicPrefix + "/" + this.identifier + "/set_fan_speed",
        send_command: this.topicPrefix + "/" + this.identifier + "/custom_command",
        state: this.topicPrefix + "/" + this.identifier + "/state",
        map: this.topicPrefix + "/" + this.identifier + "/map",
        attributes: this.topicPrefix + "/" + this.identifier + "/attributes",
        homeassistant_autoconf_vacuum: this.autoconfPrefix + "/vacuum/" + this.topicPrefix + "_" + this.identifier + "/config",
        homeassistant_autoconf_map: this.autoconfPrefix + "/camera/" + this.topicPrefix + "_" + this.identifier + "_map/config"
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
        },
        map: {
            name: this.identifier + "_map",
            unique_id: this.identifier + "_map",
            topic: this.topics.map
        }
    };

    this.connect();
    this.updateAttributesTopic();
    this.updateStateTopic();
    this.updateMapTopic();
};

MqttClient.prototype.connect = function() {
    if(!this.client || (this.client && this.client.connected === false && this.client.reconnecting === false)) {
        this.client = mqtt.connect(this.brokerURL);

        this.client.on("connect", () => {
            this.client.subscribe([
                this.topics.command,
                this.topics.set_fan_speed
            ], err => {
                if(!err) {

                    this.client.publish(this.topics.homeassistant_autoconf_vacuum, JSON.stringify(this.autoconf_payloads.vacuum), {
                        retain: true
                    });

                    this.client.publish(this.topics.homeassistant_autoconf_map, JSON.stringify(this.autoconf_payloads.map), {
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

MqttClient.prototype.updateMapTopic = function() {
    if(this.mapUpdateTimeout) {
        clearTimeout(this.mapUpdateTimeout);
    }

    if(this.client && this.client.connected === true) {
        Tools.FIND_LATEST_MAP((err, data) => {
            if(!err) {
                Tools.DRAW_MAP_PNG({
                    mapData: data.mapData,
                    log: data.log,
                    settings: this.mapSettings
                }, (err, buf) => {
                    if(!err) {
                        if (!this.lastMapResult || buf !== this.lastMapResult) {
                            this.lastMapResult = buf;
                            this.client.publish(this.topics.map, buf, {retain: true});
                        }

                        this.mapUpdateTimeout = setTimeout(() => {
                            this.updateMapTopic()
                        }, this.mapUpdateInterval);
                    } else {
                        console.error(err);
                        this.mapUpdateTimeout = setTimeout(() => {
                            this.updateMapTopic()
                        }, this.mapUpdateInterval);
                    }
                })
            } else {
                console.error(err);
                this.mapUpdateTimeout = setTimeout(() => {
                    this.updateMapTopic()
                }, this.mapUpdateInterval);
            }
        });
    } else {
        this.mapUpdateTimeout = setTimeout(() => {
            this.updateMapTopic()
        }, this.mapUpdateInterval);
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

MqttClient.prototype.updateStateTopic = function() {
    if(this.stateUpdateTimeout) {
        clearTimeout(this.stateUpdateTimeout);
    }

    if(this.client && this.client.connected === true) {
        this.vacuum.getCurrentStatus((err, res) => {
            if(!err) {
                var response = {};

                response.battery_level = res.battery;
                response.docked = [8,14].indexOf(res.state) !== -1;
                response.cleaning = res.in_cleaning === 1;
                response.charging = res.state === 8;

                switch(res.fan_power) {
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
                        response.fan_speed = res.fan_power;
                }

                if(res.error_code !== 0) {
                    response.error = res.human_error;
                }

                const stateResult = JSON.stringify(response);

                if (!this.lastStateResult || stateResult !== this.lastStateResult) {
                    this.lastStateResult = stateResult;
                    this.client.publish(this.topics.state, stateResult, {retain: true});
                }

                this.stateUpdateTimeout = setTimeout(() => {
                    this.updateStateTopic()
                }, this.stateUpdateInterval);
            } else {
                console.error(err);
                this.stateUpdateTimeout = setTimeout(() => {
                    this.updateStateTopic()
                }, this.stateUpdateInterval);
            }
        })
    } else {
        this.stateUpdateTimeout = setTimeout(() => {
            this.updateStateTopic()
        }, this.stateUpdateInterval);
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
                this.updateStateTopic();
            });
            break;
        case COMMANDS.stop:
            this.vacuum.stopCleaning(() => {
                this.updateStateTopic();
            });
            break;
        case COMMANDS.return_to_base:
            this.vacuum.stopCleaning(() => {
                this.vacuum.driveHome(() => {
                    this.updateStateTopic();
                });
            });
            break;
        case COMMANDS.clean_spot:
            this.vacuum.spotClean(() => {
                this.updateStateTopic();
            });
            break;
        case COMMANDS.locate:
            this.vacuum.findRobot(() => {
                this.updateStateTopic();
            });
            break;
        case COMMANDS.start_pause:
            this.vacuum.getCurrentStatus((err, res) => {
                if(!err) {
                    if(res.in_cleaning === 1 && [5,11,17].indexOf(res.state) !== -1) {
                        this.vacuum.pauseCleaning(() => {
                            this.updateStateTopic();
                        });
                    } else if(res.in_cleaning === 2 && res.state === 10) {
                        this.vacuum.resumeCleaningZone(() => {
                            this.updateStateTopic();
                        });
                    } else {
                        this.vacuum.startCleaning(() => {
                            this.updateStateTopic();
                        });
                    }
                }
            });
            break;
        case COMMANDS.set_fan_speed:
            this.vacuum.setFanSpeed(FAN_SPEEDS[param], () => {
                this.updateStateTopic();
            });
            break;
        default:
            this.updateStateTopic();
    }

};

module.exports = MqttClient;