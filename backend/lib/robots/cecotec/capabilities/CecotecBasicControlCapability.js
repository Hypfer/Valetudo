const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");

/**
 * @extends BasicControlCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecBasicControlCapability extends BasicControlCapability {
    async start() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.start();
    }

    async stop() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.stop();
    }

    async pause() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.pause();
    }

    async home() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.home();
    }
};
