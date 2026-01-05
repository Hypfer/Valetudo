const BEightParser = require("../../../msmart/BEightParser");
const MopDockMopDryingTimeControlCapability = require("../../../core/capabilities/MopDockMopDryingTimeControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartMopDockDryingSettingsDTO = require("../../../msmart/dtos/MSmartMopDockDryingSettingsDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MopDockMopDryingTimeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaMopDockMopDryingTimeControlCapability extends MopDockMopDryingTimeControlCapability {
    async getDuration() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_MOP_DOCK_DRYING_SETTINGS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartMopDockDryingSettingsDTO) {
            switch (parsedResponse.mode) {
                case 5:
                    return MideaMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS;
                case 6:
                    return MideaMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS;
                case 7:
                    return MideaMopDockMopDryingTimeControlCapability.DURATION.COLD;
                default:
                    throw new Error(`Received invalid value ${parsedResponse.mode}`);
            }
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    async setDuration(newDuration) {
        let val;

        switch (newDuration) {
            case MideaMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS:
                val = 5;
                break;
            case MideaMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS:
                val = 6;
                break;
            case MideaMopDockMopDryingTimeControlCapability.DURATION.COLD:
                val = 7;
                break;
            default:
                throw new Error(`Invalid value: ${newDuration}`);
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_MOP_DOCK_DRYING_SETTINGS,
                Buffer.from([
                    val
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    getProperties() {
        return {
            supportedDurations: [
                MideaMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS,
                MideaMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS,
                MideaMopDockMopDryingTimeControlCapability.DURATION.COLD,
            ],
        };
    }
}

module.exports = MideaMopDockMopDryingTimeControlCapability;
