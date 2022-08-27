const asyncMqtt = require("async-mqtt");
const HassAnchor = require("./homeassistant/HassAnchor");
const HassController = require("./homeassistant/HassController");
const HomieCommonAttributes = require("./homie/HomieCommonAttributes");
const KeyValueDeduplicationCache = require("../utils/KeyValueDeduplicationCache");
const Logger = require("../Logger");
const mqtt = require("mqtt");
const MqttCommonAttributes = require("./MqttCommonAttributes");
const RobotMqttHandle = require("./handles/RobotMqttHandle");
const Semaphore = require("semaphore");
const Tools = require("../utils/Tools");

/**
 * @typedef {object} DeconfigureOptions
 * @property {boolean} [cleanHomie] Default true
 * @property {boolean} [cleanHass] Default true
 * @property {boolean} [unsubscribe] Default true
 */

class MqttController {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.mutexes = {
            reconfigure: Semaphore(1)
        };

        this.messageDeduplicationCache = new KeyValueDeduplicationCache({});

        this.client = null;
        this.refreshInterval = 30 * 1000;
        this.refreshIntervalID = null;

        /** @type {Array<import("./handles/NodeMqttHandle")>} */
        this.nodes = [];

        this.subscriptions = {};

        this.state = HomieCommonAttributes.STATE.DISCONNECTED;
        this.stats = {
            messages: {
                count: {
                    received: 0,
                    sent: 0
                },
                bytes: {
                    received: 0,
                    sent: 0
                }

            },
            connection: {
                connects: 0,
                disconnects: 0,
                reconnects: 0,
                errors: 0
            }
        };

        this.configDefaults = {
            identity: {
                friendlyName: this.robot.getModelName() + " " + Tools.GET_HUMAN_READABLE_SYSTEM_ID(),
                identifier: Tools.GET_HUMAN_READABLE_SYSTEM_ID()
            },
            customizations: {
                topicPrefix: "valetudo"
            }
        };

        /** @public */
        this.homieAddICBINVMapProperty = false;

        this.mqttClientCloseEventHandler = async () => {
            //intentionally empty default
        };

        this.loadConfig();

        this.robot.onMapUpdated(() => {
            this.onMapUpdated();
        });

        /** @type {import("./handles/RobotMqttHandle")|null} */
        this.robotHandle = null;
        /** @type {HassController} */
        this.hassController = null;

        if (this.currentConfig.enabled) {
            if (this.currentConfig.interfaces.homeassistant.enabled) {
                this.hassController = new HassController({
                    controller: this,
                    robot: this.robot,
                    config: this.config
                });
            }

            this.robotHandle = new RobotMqttHandle({
                robot: options.robot,
                controller: this,
                baseTopic: this.currentConfig.customizations.topicPrefix,
                topicName: this.currentConfig.identity.identifier,
                friendlyName: this.currentConfig.identity.friendlyName
            });

            this.connect().catch(err => {
                Logger.error("Error during MQTT connect", err);
            });
        }

        this.config.onUpdate(async (key) => {
            if (key === "mqtt") {
                await this.shutdown();

                this.loadConfig();

                if (this.currentConfig.enabled) {
                    if (this.currentConfig.interfaces.homeassistant.enabled) {
                        this.hassController = new HassController({
                            controller: this,
                            robot: this.robot,
                            config: this.config
                        });
                    } else {
                        this.hassController = null;
                    }

                    this.robotHandle = new RobotMqttHandle({
                        robot: options.robot,
                        controller: this,
                        baseTopic: this.currentConfig.customizations.topicPrefix,
                        topicName: this.currentConfig.identity.identifier,
                        friendlyName: this.currentConfig.identity.friendlyName
                    });

                    await this.connect();
                } else {
                    this.robotHandle = null;
                    this.hassController = null;
                }
            }
        });
    }

    /**
     * @public
     * @return {{stats: ({messages: {bytes: {received: number, sent: number}, count: {received: number, sent: number}}, connection: {reconnects: number, connects: number, disconnects: number, errors: number}}), state: string}}
     */
    getStatus() {
        return {
            state: this.state,
            stats: this.stats
        };
    }

    /**
     * @public
     * @return {{identity: {identifier: string, friendlyName: string}, customizations: {topicPrefix: string}}}
     */
    getConfigDefaults() {
        return this.configDefaults;
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");

        this.currentConfig = Tools.CLONE({
            clientId: "valetudo_" + Tools.GET_HUMAN_READABLE_SYSTEM_ID(),
            qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,

            enabled: mqttConfig.enabled,
            connection: mqttConfig.connection,
            identity: mqttConfig.identity,
            interfaces: mqttConfig.interfaces,
            customizations: mqttConfig.customizations
        });

        if (!this.currentConfig.identity.identifier) {
            this.currentConfig.identity.identifier = this.configDefaults.identity.identifier;
        }

        if (!this.currentConfig.identity.friendlyName) {
            this.currentConfig.identity.friendlyName = this.configDefaults.identity.friendlyName;
        }

        if (!this.currentConfig.customizations.topicPrefix) {
            this.currentConfig.customizations.topicPrefix = this.configDefaults.customizations.topicPrefix;
        }

        this.currentConfig.stateTopic = this.currentConfig.customizations.topicPrefix + "/" + this.currentConfig.identity.identifier + "/$state";
    }

    /**
     * @private
     */
    startAutorefreshService() {
        if (this.refreshIntervalID === null) {
            this.refreshIntervalID = setInterval(() => {
                if (!this.robotHandle) {
                    return;
                }

                this.robotHandle.refresh().catch((reason => {
                    Logger.error("Failed auto refresh:", reason);
                }));
            }, this.refreshInterval);
        }
    }

    /**
     * @private
     */
    stopAutorefreshService() {
        if (this.refreshIntervalID !== null) {
            clearInterval(this.refreshIntervalID);
            this.refreshIntervalID = null;
        }
    }

    /**
     * @private
     * @return {object}
     */
    getMqttOptions() {
        const options = {
            clientId: this.currentConfig.clientId,
            // Quoting the MQTT.js docs: set to false to receive QoS 1 and 2 messages while offline
            // Useful to make sure that commands arrive on flaky wifi connections
            clean: false
        };

        if (this.currentConfig.connection.tls.enabled && this.currentConfig.connection.tls.ca) {
            options.ca = this.currentConfig.connection.tls.ca;
        }

        if (this.currentConfig.connection.authentication.credentials.enabled) {
            options.username = this.currentConfig.connection.authentication.credentials.username;
            options.password = this.currentConfig.connection.authentication.credentials.password ?? undefined;
        }

        if (this.currentConfig.connection.authentication.clientCertificate.enabled) {
            options.cert = this.currentConfig.connection.authentication.clientCertificate.certificate;
            options.key = this.currentConfig.connection.authentication.clientCertificate.key;
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
                topic: this.currentConfig.stateTopic,
                payload: HomieCommonAttributes.STATE.LOST,
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: true,
            };

            this.client = mqtt.connect(
                (this.currentConfig.connection.tls.enabled ? "mqtts://" : "mqtt://") +
                            this.currentConfig.connection.host + ":" + this.currentConfig.connection.port,
                options
            );

            // AsyncClient is just a wrapper and it is way more convenient in some contexts
            // @ts-ignore async-mqtt does not specify mqtt as a peer dependency
            this.asyncClient = new asyncMqtt.AsyncClient(this.client);

            this.client.on("connect", () => {
                Logger.info("Connected successfully to MQTT broker");

                this.stats.connection.connects++;
                this.messageDeduplicationCache.clear();

                this.reconfigure(async () => {
                    await HassAnchor.getTopicReference(HassAnchor.REFERENCE.AVAILABILITY).post(this.currentConfig.stateTopic);

                    try {
                        await this.robotHandle.configure();
                    } catch (e) {
                        Logger.error("Error while configuring robotHandle", e);
                    }

                    if (this.currentConfig.interfaces.homeassistant.enabled) {
                        await this.hassController.configure();
                    }

                    this.startAutorefreshService();

                    Logger.info("MQTT configured");
                }).then(() => {
                    this.setState(HomieCommonAttributes.STATE.READY).then(() => {
                        this.robotHandle.refresh().catch(err => {
                            Logger.error("Error during MQTT handle refresh", err);
                        });
                    });
                }).catch(e => {
                    Logger.error("Error on MQTT reconfigure", e);
                });
            });

            this.client.on("message", (topic, message, packet) => {
                this.stats.messages.count.received++;
                this.stats.messages.bytes.received += packet.length;

                if (!Object.prototype.hasOwnProperty.call(this.subscriptions, topic)) {
                    return;
                }

                const msg = message.toString();

                //@ts-ignore
                if (packet.retain === true) {
                    Logger.warn(
                        "Received a retained MQTT message. Most certainly you or the home automation software integration " +
                        "you are using is sending the MQTT command incorrectly. Please remove the \"retained\" flag to fix this issue. Discarding message.",
                        {
                            topic: topic,
                            message: msg
                        }
                    );

                    return;
                }

                this.subscriptions[topic](msg).catch(err => {
                    Logger.error("Error during handling of incoming MQTT message", err);
                });
            });

            this.client.on("error", (e) => {
                this.stats.connection.errors++;

                if (e && e.message === "Not supported") {
                    Logger.info("Connected to non-standard-compliant MQTT Broker.");
                } else {
                    Logger.error("MQTT error:", e.toString());

                    if (this.isInitialized()) {
                        (async () => {
                            // Do not use .reconfigure() since it will try to publish to MQTT
                            await this.setState(HomieCommonAttributes.STATE.ALERT);

                            await this.shutdown();
                            await this.connect();
                        })().then().catch(e => {
                            Logger.error("Error while handling mqtt client error reconnect", e);
                        });
                    }
                }
            });

            this.client.on("reconnect", () => {
                this.stats.connection.reconnects++;
                Logger.info("Attempting to reconnect to MQTT broker");
            });

            this.mqttClientCloseEventHandler = async () => {
                await this.handleUncleanDisconnect();
            };

            this.client.on("close", this.mqttClientCloseEventHandler);
        }
    }

    /**
     * @private
     * @return {Promise<void>}
     */
    async handleUncleanDisconnect() {
        if (this.state === HomieCommonAttributes.STATE.READY) {
            Logger.info("Connection to MQTT broker closed");

            this.messageDeduplicationCache.clear();
        }

        this.stopAutorefreshService();
        await this.setState(HomieCommonAttributes.STATE.LOST);
    }

    /**
     * @private
     * Disconnects MQTT client
     */
    async disconnect() {
        if (!this.client) {
            return;
        }

        Logger.info("Disconnecting from the MQTT Broker...");
        this.client.removeListener("close", this.mqttClientCloseEventHandler);

        const closePromise = new Promise(((resolve, reject) => {
            this.client.on("close", (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        }));

        let forceDisconnectTimeout;

        await Promise.race([
            Promise.all([
                this.asyncClient.end(),
                closePromise
            ]),
            new Promise((resolve) => {
                forceDisconnectTimeout = setTimeout(() => {
                    if (this.client !== null && typeof this.client.end === "function") {
                        this.client.end(true);

                        Logger.warn("Forced MQTT disconnect");
                    }

                    resolve();
                }, 1500);
            })
        ]);
        clearTimeout(forceDisconnectTimeout);


        if (this.client && !this.client.disconnected) {
            Logger.warn("MQTT.js is pretending to be disconnected");
            this.client.end(true);
        }

        this.client = null;
        this.asyncClient = null;

        this.messageDeduplicationCache.clear();

        Logger.info("Successfully disconnected from the MQTT Broker");
        this.stats.connection.disconnects++;
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

        //disable automatic reconnects
        this.client.options.reconnectPeriod = 0;

        this.stopAutorefreshService();

        await this.reconfigure(async () => {
            const deconfigOpts = {
                cleanHomie: this.currentConfig.interfaces.homie.cleanAttributesOnShutdown,
                cleanHass: this.currentConfig.interfaces.homeassistant.cleanAutoconfOnShutdown,
                unsubscribe: true
            };

            await this.robotHandle.deconfigure(deconfigOpts);

            if (this.currentConfig.interfaces.homeassistant.enabled) {
                await this.hassController.deconfigure(deconfigOpts);
            }

        }, {targetState: HomieCommonAttributes.STATE.DISCONNECTED});

        if (this.currentConfig.interfaces.homeassistant.enabled) {
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
        if (this.client && this.client.connected === true && this.client.disconnecting !== true) {
            await this.publish(this.currentConfig.stateTopic, state, {
                // @ts-ignore
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: true
            });
        }

        Logger.trace("MQTT State change", {
            prev: this.state,
            new: state
        });

        this.state = state;
    }

    onMapUpdated() {
        if (this.currentConfig.enabled && this.isInitialized() && this.robotHandle !== null && (this.currentConfig.customizations.provideMapData ?? true)) {
            const mapHandle = this.robotHandle.getMapHandle();

            if (mapHandle !== null) {
                mapHandle.onMapUpdated();
            }
        }
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
    reconfigure(cb, options) {
        return new Promise((resolve, reject) => {
            this.mutexes.reconfigure.take(async () => {
                const reconfOptions = {
                    reconfigState: HomieCommonAttributes.STATE.INIT,
                    targetState: HomieCommonAttributes.STATE.READY,
                    errorState: HomieCommonAttributes.STATE.ALERT
                };

                if (options !== undefined) {
                    Object.assign(reconfOptions, options);
                }

                try {
                    await this.setState(reconfOptions.reconfigState);
                    await cb();
                    await this.setState(reconfOptions.targetState);

                    this.mutexes.reconfigure.leave();
                    resolve();
                } catch (err) {
                    Logger.error("MQTT reconfiguration error", err);
                    await this.setState(reconfOptions.errorState);

                    this.mutexes.reconfigure.leave();

                    reject(err);
                }
            });
        });
    }

    /**
     * Helper function for handles to subscribe to topics of their interest
     *
     * @param {import("./handles/MqttHandle")|import("./homeassistant/components/HassComponent")} handle
     * @return {Promise<void>}
     */
    async subscribe(handle) {
        const topics = handle.getInterestingTopics();
        if (Object.keys(topics).length === 0) {
            return;
        }


        try {
            for (const topic of Object.keys(topics)) {
                // @ts-ignore
                await this.asyncClient.subscribe({
                    [topic]: {
                        qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE
                    },
                    /*
                        The resubscribe option is undocumented and thus may break in the future (2022-08-21)
                        It works around this bug(?): https://github.com/mqttjs/MQTT.js/issues/895
                        
                        According to https://github.com/mqttjs/MQTT.js/issues/749#issuecomment-1002481265, using MQTTv5 also fixes the issue
                        We should revisit this when MQTTv5 support is stable and well-established
                     */
                    resubscribe: true
                });
            }
        } catch (e) {
            if (e.message !== "client disconnecting" && e.message !== "connection closed") {
                throw e;
            }
        }


        Object.assign(this.subscriptions, topics);
    }

    /**
     * Helper function for handles to unsubscribe from topics
     *
     * @param {import("./handles/MqttHandle")|import("./homeassistant/components/HassComponent")} handle
     * @return {Promise<void>}
     */
    async unsubscribe(handle) {
        if (Object.keys(this.subscriptions).length === 0) {
            return;
        }

        try {
            await this.asyncClient.unsubscribe(Object.keys(this.subscriptions));
        } catch (e) {
            if (e.message !== "client disconnecting" && e.message !== "Connection closed") {
                throw e;
            }
        }

        for (const topic of Object.keys(this.subscriptions)) {
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
            try {
                // @ts-ignore
                await this.publish(handle.getBaseTopic(), value, {qos: handle.getQoS(), retain: handle.retained});
            } catch (e) {
                if (e.message !== "client disconnecting" && e.message !== "connection closed") {
                    Logger.warn("MQTT publication failed, topic " + handle.getBaseTopic(), e);
                }
            }
        }
    }

    /**
     * Republish all Homie attributes for an handle. This can only be used while in reconfiguration mode.
     *
     * @param {import("./handles/MqttHandle")} handle
     * @return {Promise<void>}
     */
    async publishHomieAttributes(handle) {
        if (!this.currentConfig.interfaces.homie.enabled) {
            return;
        }

        if (this.isInitialized()) {
            throw new Error("Homie attributes may be altered only while the MQTT controller is not initialized");
        }

        const attrs = handle.getHomieAttributes();
        const baseTopic = handle.getBaseTopic();

        for (const [topic, value] of Object.entries(attrs)) {
            try {
                await this.publish(baseTopic + "/" + topic, value, {
                    // @ts-ignore
                    qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                    retain: true
                });
            } catch (err) {
                if (err.message !== "client disconnecting" && err.message !== "connection closed") {
                    Logger.warn(`Failed to publish Homie attributes for handle ${handle.getBaseTopic()}. Maybe you forgot to marshal some value?`, err);
                    throw err;
                }
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
        if (!this.currentConfig.interfaces.homie.enabled) {
            return;
        }

        if (this.isInitialized()) {
            throw new Error("Homie attributes may be altered only while the MQTT controller is not initialized");
        }

        const attrs = handle.getHomieAttributes();
        const baseTopic = handle.getBaseTopic();

        for (const topic of Object.keys(attrs)) {
            try {
                // @ts-ignore
                await this.publish(baseTopic + "/" + topic, "", {
                    // @ts-ignore
                    qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                    retain: false
                });
            } catch (e) {
                Logger.warn("Failed to drop Homie attribute, topic " + topic, e);
            }
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
        if (this.currentConfig.interfaces.homeassistant.enabled) {
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
     * @return {void}
     */
    withHass(callback) {
        if (this.currentConfig.interfaces.homeassistant.enabled) {
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
        try {
            await this.publish(topic, message, options);
        } catch (err) {
            if (err.message !== "client disconnecting" && err.message !== "connection closed") {
                Logger.error("MQTT publication error:", err);
            }
        }
    }

    /**
     * This wrapper exists to enforce hard limits on buffered outgoing data on the mqtt tcp socket
     * as there is no such limit in the library, meaning that a bad wifi connection can
     * result in huge memory usage of outgoing messages piling up
     *
     * It is yet TBD how to properly handle such situations. For now we just drop all
     * messages if there is already 1MiB buffered to not crash the process and also log
     * a warning to trace this in the real world.
     *
     * @private
     * @param {string} topic
     * @param {string} message
     * @param {object} [options]
     * @return {Promise<any>}
     */
    async publish(topic, message, options) {
        //@ts-ignore
        if (this.client?.stream?.writableLength > 1024 * 1024) { //Allow for 1MiB of buffered messages
            Logger.warn(`Stale MQTT connection detected. Dropping message for ${topic}`);
        } else if (this.asyncClient) {
            //This looks like an afterthought because it is one. :(
            const hasChanged = this.messageDeduplicationCache.update(topic, message);

            if (hasChanged) {
                this.stats.messages.count.sent++;
                this.stats.messages.bytes.sent += message.length;
                return this.asyncClient.publish(topic, message, options);
            }
        } else {
            Logger.warn(`Aborting publish to ${topic} since we're currently not connected to any MQTT broker`);
        }
    }
}


module.exports = MqttController;
