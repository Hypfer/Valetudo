const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

class DreamePersistentMapControlCapability extends PersistentMapControlCapability {

    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.piid MIOT Property ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.piid = options.piid;
    }

    /**
     * This function polls the current carpet mode state
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.piid
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code === 0) {
                return res[0].value === 1;
            } else {
                throw new Error("Error code " + res[0].code);
            }

        } else {
            throw new Error("Received invalid response");
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const res = await this.robot.sendCommand("set_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.piid,
                value: 1
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code !== 0) {
                throw new Error("Error code " + res[0].code);
            }
        } else {
            throw new Error("Received invalid response");
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const res = await this.robot.sendCommand("set_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.piid,
                value: 0
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code !== 0) {
                throw new Error("Error code " + res[0].code);
            }
        } else {
            throw new Error("Received invalid response");
        }
    }
}

module.exports = DreamePersistentMapControlCapability;
