//Required for now
require("../DnsHack");

const mqtt = require("mqtt");
const zlib = require("zlib");
const Logger = require("../Logger");
const MqttAutoConfManager = require("./MqttAutoConfManager");
const attributes = require("../entities/state/attributes");
const capabilities = require("../core/capabilities");
const attributeHandlers = require("./attributeHandlers");

const ValetudoMapSegment = require("../entities/core/ValetudoMapSegment");

/**
 * This class will provide 2 + n Home Assistant Entities
 * 1) A Vacuum entitiy containing the robot state
 * 2) An entity containing the Map Data as Base64
 * n) An entity for an attribute
 */

class MqttClient {
    /**
     * This Class implements the vacuum.mqtt component specification of Home Assistant which can be found here
     * https://www.home-assistant.io/integrations/vacuum.mqtt/
     *
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.loadConfig();
        if (this.enabled) {
            this.connect();
        }

        this.config.onUpdate(async (key) => {
            if (key === "mqtt") {
                await this.disconnect();
                this.loadConfig();
                if (this.enabled) {
                    this.connect();
                }
            }
        });


        this.robot.onStateUpdated(() => {
            this.updateStatusTopic();
            this.handleStateAttributes();
        });

        this.robot.onMapUpdated(() => {
            if (this.provideMapData === true) {
                this.updateMapDataTopic(this.robot.state.map);
            }
        });

        this.stateAttributeHandlers = {};
        this.capabilityAttributeHandlers = {};
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");

        this.autoConfManager = new MqttAutoConfManager({
            robot: this.robot,
            identifier: mqttConfig.identifier,
            autoconfPrefix: mqttConfig.autoconfPrefix,
            topicPrefix: mqttConfig.topicPrefix
        });



        this.enabled = mqttConfig.enabled;
        this.server = mqttConfig.server;
        this.port = mqttConfig.port || 1883;
        this.identifier = mqttConfig.identifier;
        this.username = mqttConfig.username;
        this.password = mqttConfig.password;
        this.usetls = mqttConfig.usetls;
        this.ca = mqttConfig.ca || "";
        this.clientCert = mqttConfig.clientCert || "";
        this.clientKey = mqttConfig.clientKey || "";
        this.qos = mqttConfig.qos || 0;

        this.attributesUpdateInterval = mqttConfig.attributesUpdateInterval || 60000;
        this.provideMapData = mqttConfig.provideMapData !== undefined ? mqttConfig.provideMapData : true;
    }

    /**
     * @private
     */
    connect() {
        if (!this.client || (this.client && this.client.connected === false && this.client.reconnecting === false)) {
            const options = {
                clientId: this.identifier
            };

            if (this.username) {
                options.username = this.username;
            }
            if (this.password) {
                options.password = this.password;
            }
            if (this.ca) {
                options.ca = this.ca;
            }
            if (this.clientCert) {
                options.cert = this.clientCert;
            }
            if (this.clientKey) {
                options.key = this.clientKey;
            }

            options.will = {
                topic: this.autoConfManager.topics.availability,
                payload: MqttClient.HA_AVAILABILITY_STATES.OFFLINE,
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
                    this.autoConfManager.topics.command,
                    this.autoConfManager.topics.set_fan_speed,
                    this.autoConfManager.topics.custom_command
                ], {qos:this.qos}, err => {
                    if (!err) {
                        this.publishAutoConf();
                        this.updateAvailabilityTopic();

                        this.robot.pollState().then(() => {}).catch(err => {
                            Logger.error("Error while polling state", err);
                        });

                        this.pollAttributes().then(() => {}).catch(err => {
                            Logger.error("Error while polling attributes", err);
                        });
                    } else {
                        Logger.error("MQTT subscribe failed: ", err.toString());
                    }
                });
            });

            this.client.on("message", (topic, message) => { //TODO
                let msg = message.toString();
                switch (topic) {
                    case this.autoConfManager.topics.send_command:
                        this.handleCustomCommand(msg);
                        break;
                    case this.autoConfManager.topics.set_fan_speed:
                        if (this.robot.capabilities[capabilities.FanSpeedControlCapability.TYPE]) {
                            this.robot.capabilities[capabilities.FanSpeedControlCapability.TYPE].setIntensity(msg)
                                .then(() => {}).catch(err => {
                                    Logger.warn("Failed to set Fan Speed Preset " + msg, err);
                                });
                        } else {
                            Logger.warn("Unable to set fan speed due to missing capability.");
                        }
                        break;
                    case this.autoConfManager.topics.command:
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
    publishAutoConf() {
        this.autoConfManager.autoconfData.forEach(data => {
            this.publish(data.topic, data.payload);
        });
    }

    /**
     * @private
     */
    updateAvailabilityTopic() {
        if (this.client) {
            this.publish(this.autoConfManager.topics.availability, MqttClient.HA_AVAILABILITY_STATES.ONLINE);
        }
    }

    /**
     * @private
     */
    updateStatusTopic() {
        const StatusStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(attributes.StatusStateAttribute);
        const BatteryStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(attributes.BatteryStateAttribute);
        const FanSpeedStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: attributes.IntensityStateAttribute.name,
            attributeType: attributes.IntensityStateAttribute.TYPE.FAN_SPEED
        });


        var response = {};

        if (StatusStateAttribute) {
            response.state = MqttClient.HA_STATE_MAPPINGS[StatusStateAttribute.value];
        }

        if (BatteryStateAttribute) {
            response.battery_level = BatteryStateAttribute.level;
        }

        if (FanSpeedStateAttribute) {
            response.fan_speed = FanSpeedStateAttribute.value;
        }

        this.publish(this.autoConfManager.topics.state, response);
    }

    /**
     * @private
     */
    handleStateAttributes() {
        this.robot.state.attributes.forEach(attribute => {
            let existingHandler;
            let handlerId;
            let handlerConstructor;

            if (attribute instanceof attributes.ConsumableStateAttribute) {
                handlerId = "ConsumableStateAttribute" + "." + attribute.type + "." + attribute.subType;
                handlerConstructor = attributeHandlers.state.ConsumableStateAttributeMqttHandler;
            }


            existingHandler = this.stateAttributeHandlers[handlerId];

            if (!existingHandler && handlerConstructor) {
                let autoconfData;

                this.stateAttributeHandlers[handlerId] = new handlerConstructor({
                    attribute: attribute
                });

                autoconfData = this.stateAttributeHandlers[handlerId].getAutoConfData({
                    topicPrefix: this.autoConfManager.topicPrefix,
                    autoconfPrefix: this.autoConfManager.autoconfPrefix,
                    availabilityTopic: this.autoConfManager.topics.availability,
                    deviceSpecification: this.autoConfManager.deviceSpecification,
                    identifier: this.autoConfManager.identifier
                });

                this.publish(autoconfData.topic, autoconfData.payload);
            } else if (existingHandler) {
                existingHandler.attribute = attribute;
            }
        });

        Object.values(this.stateAttributeHandlers).forEach(handler => {
            this.publish(
                handler.getStateTopic({
                    topicPrefix: this.autoConfManager.topicPrefix,
                    identifier: this.autoConfManager.identifier
                }),
                handler.getPayload()
            );
        });
    }

    /**
     * @private
     */
    async pollCapabilityAttributes() {
        const autoconfData = [];

        if (this.robot.capabilities[capabilities.WifiConfigurationCapability.TYPE]) {
            if (!this.capabilityAttributeHandlers[capabilities.WifiConfigurationCapability.TYPE]) {

                this.capabilityAttributeHandlers[capabilities.WifiConfigurationCapability.TYPE] =
                    new attributeHandlers.capability.WifiConfigurationCapabilityBasedAttributeMqttHandler({
                        capability: this.robot.capabilities[capabilities.WifiConfigurationCapability.TYPE]
                    });

                autoconfData.push(
                    this.capabilityAttributeHandlers[capabilities.WifiConfigurationCapability.TYPE].getAutoConfData({
                        topicPrefix: this.autoConfManager.topicPrefix,
                        autoconfPrefix: this.autoConfManager.autoconfPrefix,
                        availabilityTopic: this.autoConfManager.topics.availability,
                        deviceSpecification: this.autoConfManager.deviceSpecification,
                        identifier: this.autoConfManager.identifier
                    })
                );
            }
        }


        if (autoconfData.length > 0) {
            autoconfData.forEach(data => {
                this.publish(data.topic, data.payload);
            });
        }

        for (const handler of Object.values(this.capabilityAttributeHandlers)) {
            this.publish(
                handler.getStateTopic({
                    topicPrefix: this.autoConfManager.topicPrefix,
                    identifier: this.autoConfManager.identifier
                }),
                await handler.getPayload()
            );
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async pollAttributes() {
        if (this.pollAttributesTimeout) {
            clearTimeout(this.pollAttributesTimeout);
        }

        try {
            if (this.robot.capabilities[capabilities.ConsumableMonitoringCapability.TYPE]) {
                await this.robot.capabilities[capabilities.ConsumableMonitoringCapability.TYPE].getConsumables();
            }

            await this.pollCapabilityAttributes();
        } catch (e) {
            Logger.error("Failed to poll Attributes", e);
        } finally {
            this.pollAttributesTimeout = setTimeout(() => {
                this.pollAttributes();
            }, this.attributesUpdateInterval);
        }
    }

    /**
     * @private
     * @param {import("../entities/map/ValetudoMap")} map
     */
    updateMapDataTopic(map) {
        if (this.client && this.client.connected === true && map) {
            zlib.deflate(JSON.stringify(map), (err, buf) => {
                if (!err) {
                    //If home assistant wasn't this hard to contribute to, we could save additional traffic by simply
                    //sending the binary data which is supported by mqtt but not the sensor.mqtt implementation in HA
                    //because it always expects a utf-8 payload :|
                    this.client.publish(this.autoConfManager.topics.map_data, buf.toString("base64"), {retain: true, qos:this.qos});
                } else {
                    Logger.error("Error while deflating map data for mqtt publish", err);
                }
            });

        }
    }


    /**
     * @private
     * @param {string} command
     */
    async handleCommand(command) { //TODO
        try {
            if (
                [
                    MqttClient.MQTT_COMMANDS.START,
                    MqttClient.MQTT_COMMANDS.STOP,
                    MqttClient.MQTT_COMMANDS.RETURN_TO_BASE,
                    MqttClient.MQTT_COMMANDS.PAUSE
                ].includes(command)
            ) {
                const capability = this.robot.capabilities[capabilities.BasicControlCapability.TYPE];

                if (capability) {
                    switch (command) {
                        case MqttClient.MQTT_COMMANDS.START:
                            await capability.start();
                            break;
                        case MqttClient.MQTT_COMMANDS.STOP:
                            await capability.stop();
                            break;
                        // noinspection JSUnreachableSwitchBranches
                        case MqttClient.MQTT_COMMANDS.PAUSE:
                            await capability.pause();
                            break;
                        case MqttClient.MQTT_COMMANDS.RETURN_TO_BASE:
                            await capability.stop();
                            await capability.home();
                            break;
                    }
                } else {
                    Logger.warn("Unable to execute " + command + " due to missing capability");
                }
            } else if (command === MqttClient.MQTT_COMMANDS.LOCATE) {
                const capability = this.robot.capabilities[capabilities.LocateCapability.TYPE];

                if (capability) {
                    await capability.locate();
                } else {
                    Logger.warn("Unable to execute " + command + " due to missing capability");
                }
            }

            /*
                case MQTT_COMMANDS.CLEAN_SPOT:
                    await this.vacuum.spotClean();
                    break;
                */
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
                    case MqttClient.CUSTOM_COMMANDS.ZONED_CLEANUP: {
                        if (this.robot.capabilities[capabilities.ZoneCleaningCapability.TYPE]) {
                            const zone_ids = msg["zone_ids"];
                            const loadedZones = [];

                            if (Array.isArray(zone_ids) && zone_ids.length > 0) {
                                const allValid = zone_ids.every(zone_id => {
                                    const zoneFromConfig = this.config.get("zonePresets")[zone_id];

                                    if (zoneFromConfig) {
                                        loadedZones.push(zoneFromConfig);

                                        return true;
                                    } else {
                                        return false;
                                    }
                                });

                                if (allValid) {
                                    try {
                                        await this.robot.capabilities[capabilities.ZoneCleaningCapability.TYPE].start(loadedZones);
                                    } catch (e) {
                                        Logger.warn("Error while starting zone cleaning for zone_ids " + zone_ids.join(","), e);
                                    }
                                } else {
                                    Logger.warn("Unable to start zoned_cleanup due to invalid zone_ids.");
                                }
                            } else {
                                Logger.warn("Unable to start zoned_cleanup due to missing zone_ids.");
                            }
                        } else {
                            Logger.warn("Unable to start zoned cleanup via MQTT due to missing capability.");
                        }
                        break;
                    }
                    /**
                     * {
                     *   "command": "go_to",
                     *   "spot_id": "Somewhere"
                     * }
                     */
                    case MqttClient.CUSTOM_COMMANDS.GO_TO:
                        if (this.robot.capabilities[capabilities.GoToLocationCapability.TYPE]) {
                            const locationPreset = this.config.get("goToLocationPresets")[msg.spot_id];

                            if (locationPreset) {
                                try {
                                    await this.robot.capabilities[capabilities.GoToLocationCapability.TYPE].goTo(locationPreset);
                                } catch (e) {
                                    Logger.warn("Error while going to goToLocationPreset for preset " + msg.spot_id, e);
                                }
                            } else {
                                Logger.warn("Unable to start go_to for invalid or missing preset id " + msg.spot_id);
                            }
                        } else {
                            Logger.warn("Unable to start go_to via MQTT due to missing capability.");
                        }

                        break;
                    /**
                     * {
                     *   "command": "segment_cleanup",
                     *   "segment_ids": [
                     *     13,
                     *     37
                     *   ]
                     * }
                     */
                    case MqttClient.CUSTOM_COMMANDS.SEGMENT_CLEANUP:
                        if (this.robot.capabilities[capabilities.MapSegmentationCapability.TYPE]) {
                            try {
                                await this.robot.capabilities[capabilities.MapSegmentationCapability.TYPE].executeSegmentAction(msg.segment_ids.map(sid => {
                                    return new ValetudoMapSegment({
                                        id: sid
                                    });
                                }));
                            } catch (e) {
                                Logger.warn("Error while starting segment_cleaning for segmment_ids " + msg.segment_ids.join(","), e);
                            }
                        } else {
                            Logger.warn("Unable to start segment_cleanup via MQTT due to missing capability.");
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
     * @private
     *
     * @param {string} topic
     * @param {*} payload Will be stringified
     */
    publish(topic, payload) {
        if (this.client && this.client.connected === true) {
            this.client.publish(
                topic,
                typeof payload === "string" ? payload : JSON.stringify(payload),
                {retain: true, qos: this.qos},
                err => {
                    if (err) {
                        Logger.error("Error while publishing to topic " + topic, err);
                    }
                });
        }
    }


    /**
     * @private
     * Disconnects MQTT client
     */
    disconnect() {
        if (!this.client) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
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

MqttClient.HA_AVAILABILITY_STATES = {
    ONLINE: "online",
    OFFLINE: "offline"
};

/**
 * They can be found here:
 * https://github.com/home-assistant/home-assistant/blob/master/homeassistant/components/vacuum/__init__.py#L58
 *
 */
MqttClient.HA_STATES = {
    CLEANING: "cleaning",
    PAUSED: "paused",
    IDLE: "idle",
    RETURNING: "returning",
    DOCKED: "docked",
    ERROR: "error"
};

MqttClient.HA_STATE_MAPPINGS = {
    [attributes.StatusStateAttribute.VALUE.ERROR]: MqttClient.HA_STATES.ERROR,
    [attributes.StatusStateAttribute.VALUE.DOCKED]: MqttClient.HA_STATES.DOCKED,
    [attributes.StatusStateAttribute.VALUE.IDLE]: MqttClient.HA_STATES.IDLE,
    [attributes.StatusStateAttribute.VALUE.RETURNING]: MqttClient.HA_STATES.RETURNING,
    [attributes.StatusStateAttribute.VALUE.CLEANING]: MqttClient.HA_STATES.CLEANING,
    [attributes.StatusStateAttribute.VALUE.PAUSED]: MqttClient.HA_STATES.PAUSED,
    [attributes.StatusStateAttribute.VALUE.MANUAL_CONTROL]: MqttClient.HA_STATES.CLEANING,
    [attributes.StatusStateAttribute.VALUE.MOVING]: MqttClient.HA_STATES.CLEANING
};

MqttClient.MQTT_COMMANDS = {
    START: "start",
    RETURN_TO_BASE: "return_to_base",
    STOP: "stop",
    CLEAN_SPOT: "clean_spot",
    LOCATE: "locate",
    PAUSE: "pause"
};

MqttClient.CUSTOM_COMMANDS = {
    GO_TO: "go_to",
    ZONED_CLEANUP: "zoned_cleanup",
    SEGMENT_CLEANUP: "segment_cleanup"
};

module.exports = MqttClient;
