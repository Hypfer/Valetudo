const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");

class DreameBasicControlCapability extends BasicControlCapability {
    /**
     * The most basic functionalities
     *
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.start
     * @param {number} options.miot_actions.start.siid
     * @param {number} options.miot_actions.start.aiid
     *
     * @param {object} options.miot_actions.stop
     * @param {number} options.miot_actions.stop.siid
     * @param {number} options.miot_actions.stop.aiid
     *
     * @param {object} options.miot_actions.pause
     * @param {number} options.miot_actions.pause.siid
     * @param {number} options.miot_actions.pause.aiid
     *
     * @param {object} options.miot_actions.home
     * @param {number} options.miot_actions.home.siid
     * @param {number} options.miot_actions.home.aiid
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
    }

    async start() {
        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.start.siid,
                aiid: this.miot_actions.start.aiid,
                in: []
            }
        );
    }

    async stop() {
        await this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.miot_actions.stop.siid,
            aiid: this.miot_actions.stop.aiid,
            in: []
        }
        );
    }

    async pause() {
        await this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.miot_actions.pause.siid,
            aiid: this.miot_actions.pause.aiid,
            in: []
        });
    }

    async home() {
        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.home.siid,
                aiid: this.miot_actions.home.aiid,
                in: []
            }
        );
    }

}

module.exports = DreameBasicControlCapability;
