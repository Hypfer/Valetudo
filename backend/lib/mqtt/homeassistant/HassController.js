const MqttCommonAttributes = require("../MqttCommonAttributes");
const Tools = require("../../utils/Tools");

/**
 * This class is the main controller for all Hass components. Components are preferentially registered to the MQTT
 * handle that they are related to, and recycle the handle topics or the values using HassAnchors.
 *
 * Non-compliant components that need a special implementation can be registered here in the constructor using
 * .registerNonCompliantComponent(). However, this should be avoided whenever possible.
 *
 * All components, regardless of where they are registered, must never talk to the main MqttController and they will
 * always talk to this controller.
 * This controller handles publication of autodiscovery topics and (optionally) topic data that can't be handled by
 * mqtt handles.
 *
 * Note that subscription is currently unimplemented for Hass. It can be easily added in a similar way to the main
 * MqttController if there's an actual need for it.
 */
class HassController {
    /**
     * @param {object} options
     * @param {import("../MqttController")} options.controller
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../Configuration")} options.config
     * @param {string} options.friendlyName
     */
    constructor(options) {
        this.controller = options.controller;
        this.robot = options.robot;
        this.config = options.config;
        this.friendlyName = options.friendlyName;

        this.loadConfig();


        /** @package */
        this.debugAnchors = false;

        /**
         * Components so special they need their own completely separate implementation and management workflow.
         *
         * @private
         */
        this.nonCompliantComponents = [];
    }

    /**
     * @private
     */
    loadConfig() {
        const debugConfig = this.config.get("debug");

        this.topicPrefix = this.controller.currentConfig.customizations.topicPrefix;
        this.identifier = this.controller.currentConfig.identity.identifier;
        this.qos = this.controller.currentConfig.qos;

        this.objectId = `valetudo_${this.identifier.toLowerCase()}`;

        this.debugAnchors = debugConfig.debugHassAnchors ?? false;
    }

    /**
     * Get base topic for Home Assistant topics that can't be mapped to the handle-based topics
     *
     * @return {string}
     */
    getBaseTopic() {
        return this.topicPrefix + "/" + this.identifier + "/hass";
    }

    /**
     * Returns the "device" value common to all autodiscovery topics.
     *
     * @public
     * @return {object}
     */
    getAutoconfDeviceBoilerplate() {
        return {
            manufacturer: "Valetudo",
            model: `${this.robot.getManufacturer()} ${this.robot.getModelName()}`,
            name: this.friendlyName,
            identifiers: [this.identifier],
            sw_version: Tools.GET_VALETUDO_VERSION(),
            configuration_url: `http://${Tools.GET_ZEROCONF_HOSTNAME()}`
        };
    }

    /**
     * Register non-compliant components that can't be managed by handles. Components managed by handles do not have to be
     * registered.
     *
     * @private
     * @param {import("./components/HassComponent")} component
     */
    registerNonCompliantComponent(component) {
        this.nonCompliantComponents.push(component);
    }

    /**
     * Configures all non-compliant components. This method is used by MqttController.
     *
     * @return {Promise<void>}
     */
    async configure() {
        for (const component of this.nonCompliantComponents) {
            await component.configure();
        }
    }

    /**
     * Deconfigures all non-compliant components. This method is used by MqttController.
     *
     * @param {import("../MqttController").DeconfigureOptions} [options]
     * @return {Promise<void>}
     */
    async deconfigure(options) {
        for (const component of this.nonCompliantComponents) {
            await component.deconfigure(options);
        }
    }


    /**
     * Helper function for components to subscribe to topics of their interest
     *
     * @param {import("./components/HassComponent")} component
     * @return {Promise<void>}
     */
    async subscribe(component) {
        await this.controller.subscribe(component);
    }

    /**
     * Helper function for components to unsubscribe from topics
     *
     * @param {import("./components/HassComponent")} component
     * @return {Promise<void>}
     */
    async unsubscribe(component) {
        await this.controller.unsubscribe(component);
    }

    /**
     * Refresh component's managed topics. This method is used by components internally, it shouldn't be called
     * externally.
     *
     * @package
     * @param {import("./components/HassComponent")} component
     * @param {object} topics
     * @return {Promise<void>}
     */
    async refresh(component, topics) {
        const base = component.getBaseTopic();

        for (const [topic, payload] of Object.entries(topics)) {
            await this.controller.publishHass(
                topic === "" ? base : base + "/" + topic,
                // @ts-ignore
                (payload instanceof String || payload instanceof Buffer) ? payload : JSON.stringify(payload),
                {qos: this.qos, retain: true}
            );
        }
    }

    /**
     * Refresh component's autoconf. This method is used by components internally, it shouldn't be called
     * externally.
     *
     * @package
     * @param {import("./components/HassComponent")} component
     * @param {object} payload
     * @return {Promise<void>}
     */
    async refreshAutoconf(component, payload) {
        if (!payload) {
            return;
        }

        await this.controller.publishHass(
            component.getAutoconfTopic(),
            JSON.stringify(payload),
            {qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE, retain: true}
        );
    }

    /**
     * Drop the autoconfiguration topic for the specified component.
     *
     * @param {import("./components/HassComponent")} component
     * @return {Promise<void>}
     */
    async dropAutoconf(component) {
        await this.controller.publishHass(
            component.getAutoconfTopic(),
            "",
            {qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE, retain: false}
        );
    }
}

module.exports = HassController;
