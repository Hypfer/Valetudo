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
                payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
            }).toHexString()
        );
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            if (parsedResponse.dustTimes === 0) {
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
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
                val = 1;
                break;
            default:
                throw new Error("Invalid interval");
        }

        await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildPayload(
                    MSmartConst.SETTING.SET_DOCK_INTERVALS,
                    Buffer.from([
                        0x01, // Auto-empty interval
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
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT,
            ]
        };
    }
}

module.exports = MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV1;
