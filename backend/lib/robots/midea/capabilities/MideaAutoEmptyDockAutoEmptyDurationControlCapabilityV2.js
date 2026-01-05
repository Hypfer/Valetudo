const AutoEmptyDockAutoEmptyDurationControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyDurationControlCapability");
const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends AutoEmptyDockAutoEmptyDurationControlCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2 extends AutoEmptyDockAutoEmptyDurationControlCapability {
    async getDuration() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            switch (parsedResponse.collect_dust_mode) {
                case 3:
                    return MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.LONG;
                case 2:
                    return MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.MEDIUM;
                case 1:
                    return MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.SHORT;
                default:
                    throw new Error(`Received invalid value ${parsedResponse.collect_dust_mode}`);
            }
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    async setDuration(newDuration) {
        let val;

        switch (newDuration) {
            case MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.LONG:
                val = 3;
                break;
            case MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.MEDIUM:
                val = 2;
                break;
            case MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.SHORT:
                val = 1;
                break;
            default:
                throw new Error(`Received invalid duration ${newDuration}`);
        }

        await this.robot.sendCommand(new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_AUTO_EMPTY_DURATION,
                Buffer.from([val])
            )
        }).toHexString());
    }

    getProperties() {
        return {
            supportedDurations: [
                MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.SHORT,
                MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.MEDIUM,
                MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2.DURATION.LONG,
            ],
        };
    }
}

module.exports = MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2;
