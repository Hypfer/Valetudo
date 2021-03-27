const LEDControlCapability = require("../../../core/capabilities/LEDControlCapability");
const LEDStateAttribute = require("../../../entities/state/attributes/LEDStateAttribute");

/**
 * @extends LEDControlCapability
 */
class ViomiLEDControlCapability extends LEDControlCapability {
    /**
     * This function polls the current LEDs state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/LEDStateAttribute")>>}
     */
    async getLEDs() {
        const LEDs = await this.robot.sendCommand("get_prop", ["light_state"]);
        if (LEDs.length !== 1) {
            throw new Error("Unable to retrieve LED state");
        }
        return [new LEDStateAttribute({
            type: LEDStateAttribute.TYPE.STATUS,
            subType: LEDStateAttribute.SUB_TYPE.MAIN,
            metaData: {
                status: LEDs[0] === 0 ? LEDStateAttribute.STATUS.OFF : LEDStateAttribute.STATUS.ON
            }
        })];
    }

    /**
     * @abstract
     * @param {string} status
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async setLED(status, type, subType) {
        const ledValue = status === LEDStateAttribute.STATUS.ON ? 1 : 0;
        await this.robot.sendCommand("set_light", [ledValue]);
    }

    /**
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async toggleLED(type, subType) {
        const LEDs = await this.getLEDs();
        const status = LEDs[0].metaData.status === LEDStateAttribute.STATUS.ON ? 1 : 0;
        await this.setLED(status === 1 ? LEDStateAttribute.STATUS.OFF : LEDStateAttribute.STATUS.ON, type, subType);
    }

}

module.exports = ViomiLEDControlCapability;
