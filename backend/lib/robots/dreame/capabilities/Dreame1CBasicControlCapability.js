const DreameBasicControlCapability = require("./DreameBasicControlCapability");

class Dreame1CBasicControlCapability extends DreameBasicControlCapability {
    /**
     * The most basic functionalities
     *
     * @param {object} options
     * @param {import("../Dreame1CValetudoRobot")} options.robot
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
    }

    async start() {
        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.start.siid,
                aiid: this.miot_actions.start.aiid,
                in: [{"piid":1,"value":2}]
            });

        if (res.code !== 0) {
            throw new Error("Error code " + res.code);
        }
    }
}

module.exports = Dreame1CBasicControlCapability;
