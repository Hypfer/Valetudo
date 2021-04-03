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
    }

    /**
     * @private
     */
    loadConfig() {
        const mqttConfig = this.config.get("mqtt");
        const debugConfig = this.config.get("debug");

        this.autoconfPrefix = mqttConfig.homeassistant.autoconfPrefix;
        this.debugAnchors = debugConfig.debugHassAnchors ?? false;
    }

    getBaseTopic() {
        // TODO
    }

    getBaseAutoconfTopic() {
        // TODO
    }

    getDeviceId() {
        // TODO
    }

    async getAutoconfDeviceBoilerplate() {
        // TODO
    }

    async configure() {
        // TODO
    }

    async deconfigure() {
        // TODO
    }

    async refresh(component) {
        // TODO
    }

    async refreshAutoconf(component) {
        // TODO
    }
}

module.exports = HassController;
