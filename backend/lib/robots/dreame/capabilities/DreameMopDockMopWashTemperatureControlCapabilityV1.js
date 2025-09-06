const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const MopDockMopWashTemperatureControlCapability = require("../../../core/capabilities/MopDockMopWashTemperatureControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MopDockMopWashTemperatureControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockMopWashTemperatureControlCapabilityV1 extends MopDockMopWashTemperatureControlCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @returns {Promise<MopDockMopWashTemperatureControlCapability.TEMPERATURE>}
     */
    async getTemperature() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);

        switch (deserializedResponse.HotWash) {
            case 1:
                return MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT;
            case 0:
                return MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD;
            default:
                throw new Error(`Received invalid HotWash value ${deserializedResponse.HotWash}`);
        }
    }

    /**
     * @param {MopDockMopWashTemperatureControlCapability.TEMPERATURE} newTemperature
     * @returns {Promise<void>}
     */
    async setTemperature(newTemperature) {
        let val;

        switch (newTemperature) {
            case MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT:
                val = 1;
                break;
            case MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD:
                val = 0;
                break;
            default:
                throw new Error("Invalid temperature");
        }

        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                HotWash: val
            })
        );
        await sleep(100); // Give the robot some time to think
    }

    getProperties() {
        return {
            supportedTemperatures: [
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD,
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT,
            ]
        };
    }
}

module.exports = DreameMopDockMopWashTemperatureControlCapabilityV1;
