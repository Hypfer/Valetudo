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
}

module.exports = HassController;
