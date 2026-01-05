const AutoEmptyDockAutoEmptyDurationControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyDurationControlCapability");
const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends AutoEmptyDockAutoEmptyDurationControlCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1 extends AutoEmptyDockAutoEmptyDurationControlCapability {
    async getDuration() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_ONE,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_ONE_ACTION_SUBCOMMAND.POLL_STATUS
                ])
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            switch (parsedResponse.collect_dust_mode) {
                case 0x1e:
                    return MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.LONG;
                case 0x14:
                    return MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.MEDIUM;
                case 0x0a:
                    return MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.SHORT;
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
            case MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.LONG:
                val = 0x1e;
                break;
            case MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.MEDIUM:
                val = 0x14;
                break;
            case MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.SHORT:
                val = 0x0a;
                break;
            default:
                throw new Error(`Received invalid duration ${newDuration}`);
        }

        await this.robot.sendCommand(new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.AUTO_EMPTY_DOCK_PARAMETERS,
                    0x03,
                    val
                ])
            )
        }).toHexString());
    }

    getProperties() {
        return {
            supportedDurations: [
                MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.SHORT,
                MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.MEDIUM,
                MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1.DURATION.LONG,
            ],
        };
    }
}

module.exports = MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV1;
