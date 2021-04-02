const RobotMqttHandle = require("./handles/RobotMqttHandle");
const MqttCommonAttributes = require("./MqttCommonAttributes");
const HomieCommonAttributes = require("./homie/HomieCommonAttributes");
const mqtt = require("mqtt");
const asyncMqtt = require("async-mqtt");
const Logger = require("../Logger");

class MqttController {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        this.loadConfig();

        this.client = null;
        // Workaround to be able to set two Last Will and Testament payloads, one for Homie and one for HAss
        // this.clientSecondaryLWT = null; // TODO actually implement

        /** @type {import(./NodeMqttHandler)} */
        this.nodes = [];

        /**
         * @callback subscribeCb
         * @param {string} value
         * @return {Promise<void>}
         */
        /** @type {object.<subscribeCb>} */
        this.subscriptions = {};

        this.state = HomieCommonAttributes.STATE.INIT;

        this.loadConfig();

        /** @type {import("./handles/MqttHandle")|null} */
        this.robotHandle = null;

        if (this.enabled) {
            this.robotHandle = new RobotMqttHandle({
                robot: options.robot,
                controller: this,
                baseTopic: this.topicPrefix,
                topicName: this.identifier,
                friendlyName: this.friendlyName
            });

            this.connect().then();
        }

        this.config.onUpdate(async (key) => {
            if (key === "mqtt") {
                await this.disconnect();
                this.loadConfig();

                if (this.enabled) {
                    this.robotHandle = new RobotMqttHandle({
                        robot: options.robot,
                        controller: this,
                        baseTopic: this.topicPrefix,
                        topicName: this.identifier,
                        friendlyName: this.friendlyName
                    });
                    await this.connect();
                } else {
                    this.robotHandle = null;
                }
            }
        });
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");

        this.enabled = mqttConfig.enabled;
        this.server = mqttConfig.server;
        this.clientId = mqttConfig.clientId ?? ("valetudo_" + Math.random().toString(16).substr(2, 4));
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

        this.homieEnabled = mqttConfig.homie.enabled;

        this.attributesUpdateInterval = mqttConfig.attributesUpdateInterval ?? 60000;
        this.provideMapData = mqttConfig.provideMapData !== undefined ? mqttConfig.provideMapData : true;

        this.hassEnabled = mqttConfig.hass.enabled; // TODO actually implement hass
        //this.homeassistantMapHack = mqttConfig.homeassistant.mapHack !== undefined ? mqttConfig.homeassistant.mapHack : true; // TODO


        this.registerCapabilityAttributeHandlers();
    }

    /**
     * @private
     * @return {object}
     */
    getMqttOptions() {
        const options = {
            clientId: this.clientId
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
            // let hassOptions = getMqttOptions(); // TODO actually implement HAss LWT

            if (this.homieEnabled) {
                options.will = {
                    topic: this.topicPrefix + "/" + this.identifier + "/$state",
                    payload: HomieCommonAttributes.STATE.LOST,
                    qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                    retain: true,
                };
            }

            this.client = mqtt.connect(
                (this.usetls ? "mqtts://" : "mqtt://") + this.server + ":" + this.port,
                options
            );
            // AsyncClient is just a wrapper and it is way more convenient in some contexts
            this.asyncClient = new asyncMqtt.AsyncClient(this.client);

            this.asyncClient.on("connect", async () => {
                Logger.info("Connected successfully to mqtt server");
                await this.reconfigure(async () => {
                    await this.robotHandle.configure();
                    await this.robotHandle.refresh();
                });
            });

            this.asyncClient.on("message", async (topic, message) => {
                if (!Object.prototype.hasOwnProperty.call(this.subscriptions, topic)) {
                    return;
                }
                const msg = message.toString();
                await this.subscriptions[topic](msg);
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
     * Disconnects MQTT client
     */
    async disconnect() {
        if (!this.client) {
            return;
        }
        await this.reconfigure(async () => {
            await this.robotHandle.deconfigure();
        }, {targetState: HomieCommonAttributes.STATE.DISCONNECTED});

        Logger.debug("Disconnecting MQTT Client...");
        await this.asyncClient.end(true);

        this.client = null;
        Logger.debug("Disconnecting the MQTT Client done");
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
            await this.asyncClient.publish(this.robotHandle.getBaseTopic() + "/$state", state, {
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
        const value = handle.getHomie();
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
        await this.asyncClient.publish(handle.getBaseTopic(), "", {
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
            await this.asyncClient.publish(baseTopic + "/" + topic, value, {
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: true
            });
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
            await this.asyncClient.publish(baseTopic + "/" + topic, "", {
                qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE,
                retain: false
            });
        }
    }
}


module.exports = MqttController;
