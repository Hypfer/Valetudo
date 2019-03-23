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
 * @param options.mapSettings {object}
 * @param options.mapUpdateInterval {number}
 * @constructor
 */
const MqttClient = function(options) {
    this.vacuum = options.vacuum;
    this.brokerURL = options.brokerURL;
    this.identifier = options.identifier || "rockrobo";
    this.mapSettings = options.mapSettings || {};
    this.mapUpdateInterval = options.mapUpdateInterval || 30000;

    this.topics = {
        command: "valetudo/" + this.identifier + "/command",
        set_fan_speed: "valetudo/" + this.identifier + "/set_fan_speed",
        send_command: "valetudo/" + this.identifier + "/custom_command",
        state: "valetudo/" + this.identifier + "/state",
        map: "valetudo/" + this.identifier + "/map",
        homeassistant_autoconf_vacuum: "homeassistant/vacuum/valetudo_" + this.identifier + "/config",
        homeassistant_autoconf_map: "homeassistant/camera/valetudo_" + this.identifier + "_map/config"
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
            send_command_topic: this.topics.send_command
        },
        map: {
            name: this.identifier + "_map",
            unique_id: this.identifier + "_map",
            topic: this.topics.map
        }
    };

    this.connect();
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
                        this.client.publish(this.topics.map, buf, {retain: true});
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

                this.client.publish(this.topics.state, JSON.stringify(response), {retain: true});
                this.stateUpdateTimeout = setTimeout(() => {
                    this.updateStateTopic()
                }, 10000);
            } else {
                console.error(err);
                this.stateUpdateTimeout = setTimeout(() => {
                    this.updateStateTopic()
                }, 30000);
            }
        })
    } else {
        this.stateUpdateTimeout = setTimeout(() => {
            this.updateStateTopic()
        }, 30000);
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