
class MqttController {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        this.loadConfig();

        /** @type {import(./NodeMqttHandler)} */
        this.nodes = [];
        this.initialized = false;
    }

    getBaseTopic() {
        return "";
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");

        this.enabled = mqttConfig.enabled;
        this.server = mqttConfig.server;
        this.topicPrefix = mqttConfig.topicPrefix;
        this.port = mqttConfig.port ?? 1883;
        this.identifier = mqttConfig.identifier;
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

        //this.hassEnabled = mqttConfig.hass.enabled;  // TODO
        //this.homeassistantMapHack = mqttConfig.homeassistant.mapHack !== undefined ? mqttConfig.homeassistant.mapHack : true; // TODO


        this.registerCapabilityAttributeHandlers();
    }

    /**
     * Whether the controller is initialized. The Homie structure may only be modified while the controller is not
     * initialized.
     *
     * @return {boolean}
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Register a node to this controller
     *
     * @param {import(./NodeMqttHandler)} node
     */
    registerNode(node) {
        node.setNode(this);
        this.properties.push(node);
    }

    /**
     * Deregister node
     *
     * @param {import(./NodeMqttHandler)} node
     */
    deregisterNode(node) {
        node.setNode(null);
        const idx = this.properties.indexOf(node);
        if (idx >= 0) {
            this.properties.splice(idx, 1);
        }
    }

    /**
     * Publish a value from a property to MQTT
     *
     * @package
     * @param {import(./PropertyMqttHandler)} property
     */
    async refreshProperty(property) {
        // TODO
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
     * @return {Promise<void>}
     */
    async reconfigure(cb) {
        // TODO set reconfig state
        this.isInitializing = true;
        try {
            await cb();
        } finally {
            // TODO set okay state
            this.isInitializing = false;
        }
    }
}


module.exports = MqttController;
