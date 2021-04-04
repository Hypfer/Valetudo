const Tools = require("../../Tools");
const HassAnchor = require("./HassAnchor");
const {MqttCommonAttributes} = require("../index");

class HassController {
    /**
     * @param {object} options
     * @param {import("../MqttController")} options.controller
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        this.controller = options.controller;
        this.robot = options.robot;
        this.config = options.config;

        /** @package */
        this.debugAnchors = false;

        /**
         * Components so special they need their own completely separate implementation and management workflow.
         *
         * @private
         */
        this.nonCompliantComponents = [];

        this.loadConfig();
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");
        const debugConfig = this.config.get("debug");

        this.autoconfPrefix = mqttConfig.homeassistant.autoconfPrefix;
        this.topicPrefix = mqttConfig.topicPrefix;
        this.identifier = mqttConfig.identifier;
        this.friendlyName = mqttConfig.friendlyName;

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
     * Get configured base topic for homeassistant autoconfig
     */
    getBaseAutoconfTopic() {
        return this.autoconfPrefix;
    }

    /**
     * @private
     * @return {Promise<object>}
     */
    async getAutoconfDeviceBoilerplate() {
        return {
            manufacturer: this.robot.getManufacturer(),
            model: this.robot.getModelName(),
            name: this.friendlyName,
            identifiers: [this.identifier],
            sw_version: Tools.GET_VALETUDO_VERSION() + " (Valetudo)"
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
     * Configures all non-compliant components.
     *
     * @return {Promise<void>}
     */
    async configure() {
        for (const component of this.nonCompliantComponents) {
            await component.configure();
        }
    }

    /**
     * Deconfigures all non-compliant components.
     *
     * @return {Promise<void>}
     */
    async deconfigure() {
        for (const component of this.nonCompliantComponents) {
            await component.deconfigure();
        }
    }

    /**
     * Refresh component's managed topics
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
                base + "/" + topic,
                JSON.stringify(payload),
                {qos: this.qos, retain: true}
            );
        }
    }

    /**
     * Refresh component's autoconf
     *
     * @package
     * @param {import("./components/HassComponent")} component
     * @param {object} payload
     * @return {Promise<void>}
     */
    async refreshAutoconf(component, payload) {
        Object.assign(payload, {
            device: await this.getAutoconfDeviceBoilerplate(),
        });

        await this.controller.publishHass(
            component.getAutoconfTopic(),
            JSON.stringify(payload),
            {qos: MqttCommonAttributes.QOS.AT_LEAST_ONCE, retain: true}
        );
    }
}

module.exports = HassController;
