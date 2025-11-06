const AutoEmptyDockAutoEmptyIntervalControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyIntervalControlCapability");
const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends AutoEmptyDockAutoEmptyIntervalControlCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV1 extends AutoEmptyDockAutoEmptyIntervalControlCapability {
    async getInterval() {
        const response = await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.ACTION.LEGACY_MULTI_ONE,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_ONE_ACTION_SUBCOMMAND.POLL_STATUS
                    ])
                )
            }).toHexString()
        );
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            if (parsedResponse.dustTimes === 0) {
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
            }

            if (parsedResponse.frequent_auto_empty === true) {
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT;
            }

            if (parsedResponse.dustTimes > 1) {
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT;
            } else {
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
            }
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    async setInterval(newInterval) {
        let val;
        switch (newInterval) {
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF:
                val = 0;
                break;
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT:
                val = 3;
                break;

            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL:
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT:
                val = 1;
                break;
            default:
                throw new Error("Invalid interval");
        }

        await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.AUTO_EMPTY_DOCK_PARAMETERS,
                        0x05,
                        newInterval === AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT ? 1 : 0
                    ])
                )
            }).toHexString()
        );

        await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.AUTO_EMPTY_DOCK_PARAMETERS,
                        0x02,
                        val
                    ])
                )
            }).toHexString()
        );
    }

    getProperties() {
        return {
            supportedIntervals: [
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT,
            ]
        };
    }
}

module.exports = MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV1;
