const IntensiveMoppingPathControlCapability = require("../../../core/capabilities/IntensiveMoppingPathControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends IntensiveMoppingPathControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiIntensiveMoppingPathControlCapability extends IntensiveMoppingPathControlCapability {

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_prop", ["mop_route"], {});

        if (!(Array.isArray(res) && res.length === 1)) {
            throw new Error(`Received invalid response: ${res}`);
        }

        return res[0] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_moproute", [1], {});

        await sleep(3_000); // Give the firmware a lot of time to think
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_moproute", [0], {});

        await sleep(3_000); // Give the firmware a lot of time to think
    }
}

module.exports = ViomiIntensiveMoppingPathControlCapability;
