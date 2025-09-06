const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const MopDockMopWashTemperatureControlCapability = require("../../../core/capabilities/MopDockMopWashTemperatureControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MopDockMopWashTemperatureControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockMopWashTemperatureControlCapabilityV2 extends MopDockMopWashTemperatureControlCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].MOP_EXPANSION.SIID;
        this.piid = DreameMiotServices["GEN2"].MOP_EXPANSION.PROPERTIES.HIGH_RES_MOP_DOCK_HEATER.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @returns {Promise<MopDockMopWashTemperatureControlCapability.TEMPERATURE>}
     */
    async getTemperature() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        switch (res) {
            case 3:
                return MopDockMopWashTemperatureControlCapability.TEMPERATURE.SCALDING;
            case 2:
                return MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT;
            case 1:
                return MopDockMopWashTemperatureControlCapability.TEMPERATURE.WARM;
            case 0:
                return MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD;
            default:
                throw new Error(`Received invalid value ${res}`);
        }
    }

    /**
     * @param {MopDockMopWashTemperatureControlCapability.TEMPERATURE} newTemperature
     * @returns {Promise<void>}
     */
    async setTemperature(newTemperature) {
        let val;

        switch (newTemperature) {
            case MopDockMopWashTemperatureControlCapability.TEMPERATURE.SCALDING:
                val = 3;
                break;
            case MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT:
                val = 2;
                break;
            case MopDockMopWashTemperatureControlCapability.TEMPERATURE.WARM:
                val = 1;
                break;
            case MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD:
                val = 0;
                break;
            default:
                throw new Error("Invalid temperature");
        }

        await this.helper.writeProperty(this.siid, this.piid, val);
        await sleep(100); // Give the robot some time to think
    }

    getProperties() {
        return {
            supportedTemperatures: [
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD,
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.WARM,
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT,
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.SCALDING,
            ]
        };
    }
}

module.exports = DreameMopDockMopWashTemperatureControlCapabilityV2;
