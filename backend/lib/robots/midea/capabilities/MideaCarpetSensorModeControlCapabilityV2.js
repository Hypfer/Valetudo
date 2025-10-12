const BEightParser = require("../../../msmart/BEightParser");
const CarpetSensorModeControlCapability = require("../../../core/capabilities/CarpetSensorModeControlCapability");
const MSmartCarpetBehaviorSettingsDTO = require("../../../msmart/dtos/MSmartCarpetBehaviorSettingsDTO");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends CarpetSensorModeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaCarpetSensorModeControlCapabilityV2 extends CarpetSensorModeControlCapability {
    /**
     * @private
     * @returns {Promise<MSmartCarpetBehaviorSettingsDTO>}
     */
    async _getSettings() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO) {
            return parsedResponse;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    async getMode() {
        const settings = await this._getSettings();

        switch (settings.carpet_behavior) {
            case 1:
                return CarpetSensorModeControlCapability.MODE.OFF;
            case 2:
                return CarpetSensorModeControlCapability.MODE.LIFT;
            case 0: // 0 = Avoid, meaning that the robot will never drive over carpets even when vacuuming, which makes little sense
            case 3: // 3 = Cross, which is a lot more similar to what other vendors would have as "avoid"
                return CarpetSensorModeControlCapability.MODE.AVOID;
            default:
                throw new Error(`Received invalid mode ${settings.carpet_behavior}`);
        }
    }

    async setMode(newMode) {
        const currentSettings = await this._getSettings();
        let val;

        switch (newMode) {
            case CarpetSensorModeControlCapability.MODE.OFF:
                val = 1;
                break;
            case CarpetSensorModeControlCapability.MODE.LIFT:
                val = 2;
                break;
            case CarpetSensorModeControlCapability.MODE.AVOID:
                val = 3;
                break;
            default:
                throw new Error(`Received invalid mode ${newMode}`);
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_CARPET_BEHAVIOR_SETTINGS,
                Buffer.from([
                    val,
                    currentSettings.parameter_bitfield
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    getProperties() {
        return {
            supportedModes: [
                CarpetSensorModeControlCapability.MODE.AVOID,
                CarpetSensorModeControlCapability.MODE.OFF,
                CarpetSensorModeControlCapability.MODE.LIFT,
            ]
        };
    }
}

module.exports = MideaCarpetSensorModeControlCapabilityV2;
