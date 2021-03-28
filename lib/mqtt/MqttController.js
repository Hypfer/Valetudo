class MqttController {
    constructor(options) {
        /** @type {import(./NodeMqttHandler)} */
        this.nodes = [];

        this.initialized = false;
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
