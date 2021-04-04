const asyncMqtt = require("async-mqtt");
const HomieCommonAttributes = require("./homie/HomieCommonAttributes");
const Logger = require("../Logger");
const mqtt = require("mqtt");
const MqttCommonAttributes = require("./MqttCommonAttributes");
const RobotMqttHandle = require("./handles/RobotMqttHandle");
const crypto = require("crypto");
const HassController = require("./homeassistant/HassController");
const HassAnchor = require("./homeassistant/HassAnchor");

class MqttController {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.client = null;

        /** @type {Array<import("./handles/NodeMqttHandle")>} */
        this.nodes = [];

        this.subscriptions = {};

        this.state = HomieCommonAttributes.STATE.INIT;

        this.loadConfig();

        /** @type {import("./handles/MqttHandle")|null} */
        this.robotHandle = null;
        /** @type {HassController} */
        this.hassController = null;

        if (this.enabled) {
            this.robotHandle = new RobotMqttHandle({
                robot: options.robot,
                controller: this,
                baseTopic: this.topicPrefix,
                topicName: this.identifier,
                friendlyName: this.friendlyName
            });

            if (this.hassEnabled) {
                this.hassController = new HassController({
                    controller: this,
                    robot: this.robot,
                    config: this.config
                });
            }

            this.connect().then();
        }

        this.config.onUpdate(async (key) => {
            if (key === "mqtt") {
                const newConfig = this.config.get("mqtt");
                await this.reconfigure(async () => {
                    // If we're shutting down indefinitely, respect user settings
                    // If we're just reconfiguring, take everything down with state == init so consumers know what we're up to
                    await this.robotHandle.deconfigure({
                        cleanValues: newConfig.enabled ? true : newConfig.cleanTopicsOnShutdown,
                        cleanHomie: newConfig.enabled ? true : newConfig.homie.cleanAttributesOnShutdown,
                        unsubscribe: newConfig.enabled ? true : newConfig.clean
                    });
                    if (this.hassEnabled) {
                        await this.hassController.deconfigure();
                    }

                }, {targetState: newConfig.enabled ? HomieCommonAttributes.STATE.INIT : HomieCommonAttributes.STATE.DISCONNECTED});

                if (!newConfig.enabled) {
                    await this.setState(HomieCommonAttributes.STATE.LOST);
                    await this.setState(HomieCommonAttributes.STATE.DISCONNECTED);
                }

                this.loadConfig();

                await this.disconnect();

                if (this.enabled) {
                    this.robotHandle = new RobotMqttHandle({
                        robot: options.robot,
                        controller: this,
                        baseTopic: this.topicPrefix,
                        topicName: this.identifier,
                        friendlyName: this.friendlyName
                    });
                    if (this.hassEnabled) {
                        this.hassController = new HassController({
                            controller: this,
                            robot: this.robot,
                            config: this.config
                        });
                    } else {
                        this.hassController = null;
                    }

                    await this.connect();
                } else {
                    this.robotHandle = null;
                    this.hassController = null;
                }
            }
        });
    }

    /**
     * Generates a unique client ID. It tries to hash some unique device identifier if possible to have a static ID,
     * falling back to a randomly generated one.
     *
     * @private
     * @return {string}
     */
    genClientId() {
        // @ts-ignore - deviceId only exists in MiioValetudoRobot
        const devideId = this.robot.deviceId;
        if (devideId === undefined) {
            return "valetudo_" + Math.random().toString(16).substr(2, 8);
        }
        const sha256 = crypto.createHash("sha256");
        sha256.update(devideId.toString());
        return "valetudo_" + sha256.digest("hex").substr(0, 8);
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");

        this.enabled = mqttConfig.enabled;
        this.server = mqttConfig.server;
        this.clientId = mqttConfig.clientId ?? this.genClientId();
        this.clean = mqttConfig.clean;
        this.cleanTopics = mqttConfig.cleanTopicsOnShutdown;  // TODO for hass
        this.topicPrefix = mqttConfig.topicPrefix;
        this.port = mqttConfig.port ?? 1883;
        this.identifier = mqttConfig.identifier;
        this.friendlyName = mqttConfig.friendlyName;
        this.username = mqttConfig.username;
        this.password = mqttConfig.password;
        this.usetls = mqttConfig.usetls;
        this.ca = mqttConfig.ca ?? "";
        this.clientCert = mqttConfig.clientCert ?? "";
        this.clientKey = mqttConfig.clientKey ?? "";
        this.qos = mqttConfig.qos ?? 0;

        this.stateTopic = this.topicPrefix + "/" + this.identifier + "/$state";

        this.homieEnabled = mqttConfig.homie.enabled;
        this.homieCleanAttributes = mqttConfig.homie.cleanAttributesOnShutdown ?? false;

        this.attributesUpdateInterval = mqttConfig.attributesUpdateInterval ?? 60000;
        this.provideMapData = mqttConfig.provideMapData !== undefined ? mqttConfig.provideMapData : true;

        this.hassEnabled = mqttConfig.homeassistant.enabled;
    }

    /**
     * @private
     * @return {object}
     */
    getMqttOptions() {
        const options = {
            clientId: this.clientId,
            clean: this.clean
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
        return options;
    }

    /**
     * @private
     */
    async connect() {
        if (!this.client || (this.client && this.client.connected === false && this.client.reconnecting === false)) {
            let options = this.getMqttOptions();

            options.will = {
                topic: this.stateTopic,
                payload: HomieCommonAttributes.STATE.LOST,
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: true,
            };

            this.client = mqtt.connect(
                (this.usetls ? "mqtts://" : "mqtt://") + this.server + ":" + this.port,
                options
            );
            // AsyncClient is just a wrapper and it is way more convenient in some contexts
            this.asyncClient = new asyncMqtt.AsyncClient(this.client);

            this.client.on("connect", () => {
                Logger.info("Connected successfully to MQTT broker");
                this.reconfigure(async () => {
                    await HassAnchor.getTopicReference(HassAnchor.REFERENCE.AVAILABILITY).post(this.stateTopic);
                    await this.robotHandle.configure();
                    if (this.hassEnabled) {
                        await this.hassController.configure();
                    }
                }).then(() => {
                    this.robotHandle.refresh().then();
                });
            });

            this.client.on("message", (topic, message) => {
                if (!Object.prototype.hasOwnProperty.call(this.subscriptions, topic)) {
                    return;
                }
                const msg = message.toString();
                this.subscriptions[topic](msg).then();
            });

            this.client.on("error", (e) => {
                if (e && e.message === "Not supported") {
                    Logger.info("Connected to non standard compliant MQTT Broker.");
                } else {
                    Logger.error("MQTT error:", e.toString());
                }
                // TODO: reconnection
            });
        }
    }

    /**
     * @private
     * Disconnects MQTT client
     */
    async disconnect() {
        if (!this.client) {
            return;
        }

        Logger.debug("Disconnecting MQTT Client...");
        this.client.end();

        this.client = null;
        Logger.debug("Disconnecting the MQTT Client done");
    }

    /**
     * Shutdown MQTT Client
     *
     * @returns {Promise<void>}
     */
    async shutdown() {
        if (!this.client) {
            return;
        }
        await this.reconfigure(async () => {
            await this.robotHandle.deconfigure({
                cleanValues: this.cleanTopics,
                cleanHomie: this.homieCleanAttributes,
                unsubscribe: this.clean
            });
            if (this.hassEnabled) {
                await this.hassController.deconfigure();
            }
        }, {targetState: HomieCommonAttributes.STATE.DISCONNECTED});

        if (this.hassEnabled) {
            // Workaround to allow sharing one single LWT with both Homie consumers and HAss.
            // "lost" for Homie means that device disconnected uncleanly, however we also set it as hass's unavailable
            // payload.
            // Switching to "lost" temporarily shouldn't bother most Homie consumers, but it will ensure hass also knows
            // what's up.
            await this.setState(HomieCommonAttributes.STATE.LOST);
            await this.setState(HomieCommonAttributes.STATE.DISCONNECTED);
        }

        await this.disconnect();
    }

    /**
     * Whether the controller is initialized. The Homie structure may only be modified while the controller is not
     * initialized.
     *
     * @public
     * @return {boolean}
     */
    isInitialized() {
        return this.state === HomieCommonAttributes.STATE.READY;
    }

    /**
     * Set device state
     *
     * @private
     * @param {string} state
     * @return {Promise<void>}
     */
    async setState(state) {
        if (this.homieEnabled) {
            await this.asyncClient.publish(this.stateTopic, state, {
                // @ts-ignore
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: true
            });
        }
        this.state = state;
    }

    /**
     * @callback reconfigureCb
     * @return {Promise<void>}
     */

    /**
     * Set the controller in reconfiguration mode, then call the callback cb. Attributes, devices and properties can be
     * safely reconfigured or changed  while inside the callback.
     *
     * @param {reconfigureCb} cb
     * @param {object} [options]
     * @param {string} [options.reconfigState]
     * @param {string} [options.targetState]
     * @param {string} [options.errorState]
     * @return {Promise<void>}
     */
    async reconfigure(cb, options) {
        const reconfOptions = {
            reconfigState: HomieCommonAttributes.STATE.INIT,
            targetState: HomieCommonAttributes.STATE.READY,
            errorState: HomieCommonAttributes.STATE.ALERT
        };
        if (options !== undefined) {
            Object.assign(reconfOptions, options);
        }

        await this.setState(reconfOptions.reconfigState);
        try {
            await cb();
            await this.setState(reconfOptions.targetState);
        } catch (err) {
            Logger.error("MQTT reconfiguration error", err);
            await this.setState(reconfOptions.errorState);
            throw err;
        }
    }

    /**
     * Helper function for handles to subscribe to topics of their interest
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async subscribe(handle) {
        const topics = handle.getInterestingTopics();
        if (Object.keys(topics).length === 0) {
            return;
        }
        await this.asyncClient.subscribe(Object.keys(topics), {qos: this.qos});
        Object.assign(this.subscriptions, topics);
    }

    /**
     * Helper function for handles to unsubscribe from topics
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async unsubscribe(handle) {
        const topics = handle.getInterestingTopics();
        if (Object.keys(topics).length === 0) {
            return;
        }
        await this.asyncClient.unsubscribe(Object.keys(topics));
        for (const topic of Object.keys(topics)) {
            delete this.subscriptions[topic];
        }
    }

    /**
     * Helper function for handles to update their published value.
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async refresh(handle) {
        if (!this.isInitialized()) {
            return;
        }
        const value = await handle.getHomie();
        if (value !== null) {
            await this.asyncClient.publish(handle.getBaseTopic(), value, {qos: this.qos, retain: handle.retained});
        }
    }

    /**
     * Mark a handle's topic as removed. This can only be used while in reconfiguration mode.
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async dropHandleValue(handle) {
        if (this.isInitialized()) {
            throw new Error("Handles may be dropped only while the MQTT controller is not initialized");
        }
        if (!this.clean) {
            return; // Users may want the values to stick around
        }
        await this.asyncClient.publish(handle.getBaseTopic(), "", {
            // @ts-ignore
            qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
            retain: false
        });
    }

    /**
     * Republish all Homie attributes for an handle. This can only be used while in reconfiguration mode.
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async publishHomieAttributes(handle) {
        if (!this.homieEnabled) {
            return;
        }
        if (this.isInitialized()) {
            throw new Error("Homie attributes may be altered only while the MQTT controller is not initialized");
        }
        const attrs = handle.getHomieAttributes();
        const baseTopic = handle.getBaseTopic();

        for (const [topic, value] of Object.entries(attrs)) {
            try {
                await this.asyncClient.publish(baseTopic + "/" + topic, value, {
                    // @ts-ignore
                    qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                    retain: true
                });
            } catch (err) {
                Logger.warn("Failed to publish Homie attributes for handle " + handle.getBaseTopic() + ". " +
                    "Maybe you forgot to marshal some value?", err);
                throw err;
            }
        }
    }

    /**
     * Remove all Homie attributes for an handle. This can only be used while in reconfiguration mode.
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async dropHomieAttributes(handle) {
        if (!this.homieEnabled) {
            return;
        }
        if (this.isInitialized()) {
            throw new Error("Homie attributes may be altered only while the MQTT controller is not initialized");
        }
        const attrs = handle.getHomieAttributes();
        const baseTopic = handle.getBaseTopic();

        for (const topic of Object.keys(attrs)) {
            // @ts-ignore
            await this.asyncClient.publish(baseTopic + "/" + topic, "", {
                // @ts-ignore
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: false
            });
        }
    }

    /**
     * @callback withHassAsyncCb
     * @param {import("./homeassistant/HassController")} hass
     * @return {Promise<void>}
     */
    /**
     * This is a fancy wrapper inspired by Python's "with" statement. It should be called by Handles that intend to
     * register their own Hass components. The callback will only be called if Hass is actually enabled.
     *
     * @param {withHassAsyncCb} callback
     * @return {Promise<void>}
     */
    async withHassAsync(callback) {
        if (this.hassEnabled) {
            await callback(this.hassController);
        }
    }


    /**
     * @callback withHassCb
     * @param {import("./homeassistant/HassController")} hass
     * @return {void}
     */
    /**
     * This is a fancy wrapper inspired by Python's "with" statement. It should be called by Handles that intend to
     * register their own Hass components. The callback will only be called if Hass is actually enabled.
     *
     * @param {withHassCb} callback
     * @return {Promise<void>}
     */
    withHass(callback) {
        if (this.hassEnabled) {
            callback(this.hassController);
        }
    }


    /**
     * This is effectively a wrapper around mqtt.publish. However, this is intended for *exclusive* usage by
     * HassController in order to enforce responsibility separation.
     * No class that doesn't end in "Controller" is allowed to publish directly.
     * All classes not ending in "Controller" must ask their respective controller to fetch their data and publish it.
     *
     * If you find yourself wanting to use this outside of HassController, please start a discussion on GitHub and
     * tag @Depau.
     *
     * @package
     * @param {string} topic
     * @param {string} message
     * @param {object} [options]
     * @return {Promise<void>}
     */
    async publishHass(topic, message, options) {
        const err = new Error();
        Error.captureStackTrace(err, this.publishHass);
        const lines = err.stack.split("\n");
        if (lines !== undefined && lines.length > 2 && !lines[2].includes(HassController.name)) {
            // I really really don't want this to be used elsewhere but I have *just a little feeling* people will still
            // attempt to do it. Don't! Fix the API to accomodate your needs and keep the responsibility separation.
            Logger.error("MqttController.publishHass MUST not be used outside of HassController!!!", err.stack);
        }

        try {
            await this.asyncClient.publish(topic, message, options);
        } catch (err) {
            Logger.error("MQTT publication error:", err);
        }
    }
}


module.exports = MqttController;
