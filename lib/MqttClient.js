const mqtt = require("mqtt");
const Logger = require("./Logger");
const url = require("url");

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

/**
 * These mapping maps the xiaomi-specific states to the standardized HA State Vacuum States
 * They can be found here:
 * https://github.com/home-assistant/home-assistant/blob/master/homeassistant/components/vacuum/__init__.py#L58
 *
 */
const HA_STATES = {
    CLEANING: "cleaning",
    PAUSED: "paused",
    IDLE: "idle",
    RETURNING: "returning",
    DOCKED: "docked",
    ERROR: "error",
    ZONE_CLEANUP: "cleaning"
};

// Codes as per Status.js
const HA_STATE_MAPPINGS = {
    "CHARGER_DISCONNECTED": HA_STATES.IDLE,
    "IDLE": HA_STATES.IDLE,
    "CLEANING": HA_STATES.CLEANING,
    "MANUAL_MODE": HA_STATES.CLEANING,
    "SPOT_CLEANING": HA_STATES.CLEANING,
    "GOING_TO_TARGET": HA_STATES.CLEANING,
    "ZONED_CLEANING": HA_STATES.ZONE_CLEANUP,
    "RETURNING_HOME": HA_STATES.RETURNING,
    "DOCKING": HA_STATES.RETURNING,
    "CHARGING": HA_STATES.DOCKED,
    "CHARGING_PROBLEM": HA_STATES.ERROR,
    "ERROR": HA_STATES.ERROR,
    "PAUSED": HA_STATES.PAUSED,
};

const HA_AVAILABILITY_STATES = {
    ONLINE: "online",
    OFFLINE: "offline"
};

/**
 * @param {number} number
 * @param {number} precision number of decimal digits
 */
const round = (number, precision) => {
    let pow = Math.pow(10, precision);
    return  Math.round(number * pow) / pow;
};

class MqttClient {
    /**
     * @param {object} options
     * @param {import("./Configuration")} options.configuration
     * @param {import("./devices/MiioVacuum")} options.vacuum
     * @param {import("./miio/Model")} options.model
     * @param {import("./Events")} options.events
     * @param {import("./dtos/MapDTO")} options.map
     */
    constructor (options) {
        this.configuration = options.configuration;
        this.vacuum = options.vacuum;
        this.model = options.model;
        this.events = options.events;
        this.map = options.map;

        this.last_ha_state = HA_STATES.IDLE;
        this.last_state = "UNKNOWN";
        this.last_attributes = {};
        this.last_cleaned_area = 0;
        this.last_cleaning_time = 0;

        this.loadConfig();
        if (this.enabled) {
            this.connect();
        }

        this.events.onMapUpdated(() => {
            if (this.provideMapData === true) {
                this.updateMapDataTopic(this.map);
            }
        });

        this.events.onStatusUpdated((statusData) => {
            this.updateStatusTopic(statusData);
            this.updateAttributesTopicOnEvent(statusData);
        });

        this.events.onMqttConfigChanged(async () => {
            await this.disconnect();
            this.loadConfig();
            if (this.enabled) {
                this.connect();
            }
        });
    }

    /**
     * @private
     */
    loadConfig() {
        let mqttConfig = this.configuration.get("mqtt");

        // convert old broker_url
        if (mqttConfig.broker_url) {
            let brokerUrl = new url.URL(mqttConfig.broker_url);
            mqttConfig.server = brokerUrl.hostname;
            mqttConfig.port = brokerUrl.port;
            mqttConfig.username = brokerUrl.username;
            mqttConfig.password = brokerUrl.password;
            mqttConfig.usetls = ["mqtts:","tls:","wss:"].indexOf(brokerUrl.protocol) > -1;
            delete mqttConfig.broker_url;
            this.configuration.set("mqtt", mqttConfig);
        }

        this.enabled = mqttConfig.enabled;
        this.server = mqttConfig.server;
        this.port = mqttConfig.port || 1883;
        this.clientId = mqttConfig.clientId;
        this.username = mqttConfig.username;
        this.password = mqttConfig.password;
        this.usetls = mqttConfig.usetls;
        this.ca = mqttConfig.ca || "";
        this.clientCert = mqttConfig.clientCert || "";
        this.clientKey = mqttConfig.clientKey || "";
        this.qos = mqttConfig.qos || 0;

        this.identifier = mqttConfig.identifier || "rockrobo";
        this.topicPrefix = mqttConfig.topicPrefix || "valetudo";
        this.autoconfPrefix = mqttConfig.autoconfPrefix || "homeassistant";
        this.attributesUpdateInterval = mqttConfig.attributesUpdateInterval || 60000;
        this.provideMapData = mqttConfig.provideMapData !== undefined ? mqttConfig.provideMapData : true;

        this.topics = {
            command: this.topicPrefix + "/" + this.identifier + "/command",
            set_fan_speed: this.topicPrefix + "/" + this.identifier + "/set_fan_speed",
            send_command: this.topicPrefix + "/" + this.identifier + "/custom_command",
            state: this.topicPrefix + "/" + this.identifier + "/state",
            map_data: this.topicPrefix + "/" + this.identifier + "/map_data",
            attributes: this.topicPrefix + "/" + this.identifier + "/attributes",
            homeassistant_autoconf_vacuum: this.autoconfPrefix + "/vacuum/" + this.topicPrefix + "_" + this.identifier + "/config",
            availability: this.topicPrefix + "/" + this.identifier + "/status",
        };
    }

    /**
     * @private
     */
    connect() {
        if (!this.client || (this.client && this.client.connected === false && this.client.reconnecting === false)) {
            const options = {};
            if (this.clientId) options.clientId = this.clientId;
            if (this.username) options.username = this.username;
            if (this.password) options.password = this.password;
            if (this.ca) options.ca = this.ca;
            if (this.clientCert) options.cert = this.clientCert;
            if (this.clientKey) options.key = this.clientKey;

            options.will = {
                topic: this.topics.availability,
                payload: HA_AVAILABILITY_STATES.OFFLINE,
                qos: this.qos,
                retain: true,
            };

            this.client = mqtt.connect(
                (this.usetls ? "mqtts://" : "mqtt://") + this.server + ":" + this.port,
                options
            );

            this.client.on("connect", () => {
                Logger.info("Connected successfully to mqtt server");
                this.client.subscribe([
                    this.topics.command,
                    this.topics.set_fan_speed,
                    this.topics.send_command
                ], {qos:this.qos}, err => {
                    if (!err) {
                        this.publishAutoConf();
                        this.updateAttributesTopic();
                    } else {
                        Logger.error("MQTT subscribe failed: ", err.toString());
                    }
                });
            });

            this.client.on("message", (topic, message) => {
                let msg = message.toString();
                switch (topic) {
                    case this.topics.send_command:
                        this.handleCustomCommand(msg);
                        break;
                    case this.topics.set_fan_speed:
                        this.handleFanSpeedRequest(msg);
                        break;
                    case this.topics.command:
                        this.handleCommand(msg);
                        break;
                }
            });

            this.client.on("error", (e) => {
                if (e && e.message === "Not supported") {
                    Logger.info("Connected to non standard compliant MQTT Broker.");
                } else {
                    Logger.error("MQTT error:", e.toString());
                }
            });
        }
    }

    /**
     * @private
     */
    async publishAutoConf() {
        let autoconf_payloads = {
            vacuum: {
                name: this.identifier,
                unique_id: this.identifier,
                device: {
                    manufacturer: this.model.getManufacturerName(),
                    model: this.model.getModelName(),
                    name: this.identifier,
                    identifiers: [this.identifier]
                },
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
                fan_speed_list: Object.keys(await this.vacuum.getFanSpeeds()),
                send_command_topic: this.topics.send_command,
                json_attributes_topic: this.topics.attributes,
                availability_topic: this.topics.availability
            }
        };

        this.client.publish(this.topics.homeassistant_autoconf_vacuum, JSON.stringify(autoconf_payloads.vacuum), {
            retain: true, qos:this.qos
        });
        this.updateAvailabilityTopic();
    }

    /**
     * @private
     * @param {import("./dtos/MapDTO")} mapDTO
     */
    updateMapDataTopic(mapDTO) {
        if (this.client && this.client.connected === true && mapDTO && mapDTO.parsedData) {
            this.client.publish(this.topics.map_data, JSON.stringify(mapDTO.parsedData), {retain: true, qos:this.qos});
        }
    }

    /**
     * @private
     * @param {import("./miio/Status")} statusData
     */
    updateAttributesTopicOnEvent(statusData) {
        this.last_ha_state = HA_STATE_MAPPINGS[statusData.state];
        this.last_state = statusData.state;
        this.last_cleaned_area = statusData.clean_area ? parseFloat((statusData.clean_area / 1000000).toFixed(2)) : 0;
        this.last_cleaning_time = statusData.clean_time ? parseFloat((statusData.clean_time / 60).toFixed(1)) : 0;

        this.updateAttributesTopic();
    }

    /**
     * @private
     */
    async updateAttributesTopic() {
        if (this.attributesUpdateTimeout) {
            clearTimeout(this.attributesUpdateTimeout);
        }

        try {
            if (this.client && this.client.connected === true) {
                var response = {};

                let consumableStatus = await this.vacuum.getConsumableStatus();
                response.mainBrush = round(consumableStatus.mainBrushLeftTime, 1);
                response.sideBrush = round(consumableStatus.sideBrushLeftTime, 1);
                response.filter = round(consumableStatus.filterLeftTime, 1);
                response.sensor = round(consumableStatus.sensorLeftTime, 1);

                let cleanSummary = await this.vacuum.getCleanSummary();
                response.cleanTime = round(cleanSummary.cleanTime, 1);
                response.cleanArea = round(cleanSummary.cleanArea, 1);
                response.cleanCount = cleanSummary.cleanCount;
                response.lastCleanedArea = this.last_cleaned_area;
                response.lastCleaningTime = this.last_cleaning_time;
                let last_runs = cleanSummary.lastRuns;
                if (last_runs.length > 0) {
                    try {
                        let cleanRecord = await this.vacuum.getCleanRecord(last_runs[0]);

                        this.last_run_stats = {
                            startTime: cleanRecord.startTime,
                            endTime: cleanRecord.endTime,
                            duration: cleanRecord.duration,
                            area: round(cleanRecord.area, 1),
                            errorCode: cleanRecord.errorCode,
                            errorDescription: cleanRecord.errorDescription,
                            finishedFlag: cleanRecord.finished
                        };
                    } catch (err) {
                        Logger.error("MQTT - getCleanRecord failed:", err);
                    }
                }
                response.last_run_stats = this.last_run_stats ? this.last_run_stats : {};

                response.state = this.last_ha_state;
                response.valetudo_state = this.last_state;
                let zoneCleaningStatus = this.vacuum.getZoneCleaningStatus();
                if (zoneCleaningStatus){
                    response.zoneStatus = zoneCleaningStatus;
                }

                if (JSON.stringify(response) !== JSON.stringify(this.last_attributes)) {
                    this.client.publish(this.topics.attributes, JSON.stringify(response), {retain: true, qos:this.qos});
                    this.last_attributes = response;
                }
            }
        } catch (err) {
            Logger.error("MQTT update attributes topic failed:", err);
        } finally {
            this.attributesUpdateTimeout = setTimeout(() => {
                this.updateAttributesTopic();
            }, this.attributesUpdateInterval);
        }
    }

    /**
     * @private
     */
    updateAvailabilityTopic() {
        if (this.client) {
            this.client.publish(this.topics.availability, HA_AVAILABILITY_STATES.ONLINE, {retain: true, qos: this.qos});
        }
    }

    /**
     * @private
     * @param {import("./miio/Status")} statusData
     */
    updateStatusTopic(statusData) {
        if (this.client && this.client.connected === true && statusData.battery !== undefined) {
            var response = {};
            response.state = HA_STATE_MAPPINGS[statusData.state];
            response.battery_level = statusData.battery;
            response.fan_speed = statusData.fan_power;
            response.cleaned_area = statusData.clean_area ? (statusData.clean_area / 1000000).toFixed(1) : 0;
            response.cleaning_time = statusData.clean_time ? (statusData.clean_time / 60).toFixed(1) : 0;

            if (statusData.error_code !== undefined && statusData.error_code !== 0) {
                response.error = statusData.human_error;
            }

            this.client.publish(this.topics.state, JSON.stringify(response), {retain: true, qos:this.qos});
        }
    }

    /**
     * @private
     * @param {string} speed
     */
    async handleFanSpeedRequest(speed) {
        try {
            await this.vacuum.setFanSpeed(speed);
        } catch (err) {
            Logger.error("MQTT handle fanspeed failed:", err);
        }
    }

    /**
     * @private
     * @param {string} command
     */
    async handleCommand(command) {
        try {
            switch (command) {
                case MQTT_COMMANDS.START: {
                    let status = await this.vacuum.getCurrentStatus();
                    if (status.in_cleaning === 2 && HA_STATE_MAPPINGS[status.state] === HA_STATES.PAUSED) {
                        await this.vacuum.resumeCleaningZone();
                    } else {
                        await this.vacuum.startCleaning();
                    }
                    break;
                }
                case MQTT_COMMANDS.STOP:
                    await this.vacuum.stopCleaning();
                    break;
                case MQTT_COMMANDS.RETURN_TO_BASE:
                    await this.vacuum.stopCleaning();
                    await this.vacuum.driveHome();
                    break;
                case MQTT_COMMANDS.CLEAN_SPOT:
                    await this.vacuum.spotClean();
                    break;
                case MQTT_COMMANDS.LOCATE:
                    await this.vacuum.findRobot();
                    break;
                case MQTT_COMMANDS.PAUSE:
                    await this.vacuum.pauseCleaning();
                    break;
            }
        } catch (err) {
            Logger.error("MQTT handle command " + command + " failed:", err);
        }
    }

    /**
     * Expects a stringified JSON payload
     * Must contain a field named "command"
     *
     * @private
     * @param {string} message
     */
    async handleCustomCommand(message) {
        let msg;

        try {
            msg = JSON.parse(message);
        } catch (e) {
            Logger.error("Invalid JSON for MQTT custom command:", e);
        }

        if (msg && msg.command) {
            try {
                switch (msg.command) {
                    /**
                     * {
                     *   "command": "zoned_cleanup",
                     *   "zone_ids": [
                     *     "Foobar",
                     *     "Baz"
                     *   ]
                     * }
                     * Note: that zone_ids can be a mix of Zone IDs (numbers) and zone names.
                     */
                    case CUSTOM_COMMANDS.ZONED_CLEANUP: {
                        const zones = msg["zone_ids"];
                        if (Array.isArray(zones) && zones.length) {
                            const zone_ids = [...this.configuration.getZones().values()]
                                .filter(zone => zones.includes(zone.name) ||
                                                zones.includes(zone.id))
                                .map(zone => zone.id);
                            await this.vacuum.startCleaningZonesById(zone_ids);
                        } else {
                            Logger.info("Missing zone_ids or empty array");
                        }
                        break;
                    }
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
                                await this.vacuum.goTo(spot_coords[1], spot_coords[2]);
                            } else {
                                Logger.info("Invalid spot_id");
                            }
                        } else {
                            Logger.info("Missing spot_id");
                        }
                        break;
                    default:
                        Logger.info("Received invalid custom command", msg.command, msg);
                }
            } catch (err) {
                Logger.error("MQTT handle custom command " + msg.command + " failed:", err);
            }
        }
    }

    /**
     * Disconnects MQTT client
     */
    disconnect() {
        if (!this.client) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            Logger.debug("Disconnecting MQTT Client...");
            this.client.end(true, () => {
                this.client = null;
                Logger.debug("Disconnecting the MQTT Client done");
                resolve();
            });
        });
    }

    /**
     * Shutdown MQTT Client
     *
     * @returns {Promise<void>}
     */
    async shutdown() {
        await this.disconnect();
    }
}

module.exports = MqttClient;
