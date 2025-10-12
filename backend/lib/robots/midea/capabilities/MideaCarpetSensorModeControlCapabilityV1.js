const BEightParser = require("../../../msmart/BEightParser");
const CarpetSensorModeControlCapability = require("../../../core/capabilities/CarpetSensorModeControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends CarpetSensorModeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaCarpetSensorModeControlCapabilityV1 extends CarpetSensorModeControlCapability {
    /**
     * @returns {Promise<string>}
     */
    async getMode() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            if (parsedResponse.carpet_evade_switch) {
                // You'd think that carpet_evade_adaptive_switch would be the smart variant that is only active when mopping,
                // but apparently it is not. What is called adaptive in the app translations, is non-adaptive normally??
                // If it turns out that I confused myself, 0x23 will be the right setting instead
                return CarpetSensorModeControlCapability.MODE.AVOID;
            } else {
                return CarpetSensorModeControlCapability.MODE.OFF;
            }
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    async setMode(newMode) {
        let val;

        switch (newMode) {
            case CarpetSensorModeControlCapability.MODE.OFF:
                val = 0;
                break;
            case CarpetSensorModeControlCapability.MODE.AVOID:
                val = 1;
                break;
            default:
                throw new Error(`Received invalid mode ${newMode}`);
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x07, // switch carpet evade
                    val
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    getProperties() {
        return {
            supportedModes: [
                CarpetSensorModeControlCapability.MODE.AVOID,
                CarpetSensorModeControlCapability.MODE.OFF
            ]
        };
    }
}

module.exports = MideaCarpetSensorModeControlCapabilityV1;
