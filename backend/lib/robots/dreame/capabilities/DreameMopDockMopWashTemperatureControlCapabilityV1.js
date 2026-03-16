const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const MopDockMopWashTemperatureControlCapability = require("../../../core/capabilities/MopDockMopWashTemperatureControlCapability");

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
    }

    /**
     * @returns {Promise<MopDockMopWashTemperatureControlCapability.TEMPERATURE>}
     */
    async getTemperature() {
        const res = await this.robot.miotHelper.readProperty(this.siid, this.piid);
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

        await this.robot.miotHelper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                HotWash: val
            })
        );
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
