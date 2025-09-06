const AutoEmptyDockAutoEmptyIntervalControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyIntervalControlCapability");
const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends AutoEmptyDockAutoEmptyIntervalControlCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockAutoEmptyIntervalControlCapability extends AutoEmptyDockAutoEmptyIntervalControlCapability {
    async getInterval() {
        const response = await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
            }).toHexString()
        );
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
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
        await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildPayload(
                    MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                    Buffer.from([
                        0x33, // middle-goback-dust
                        newInterval === AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT ? 1 : 0
                    ])
                )
            }).toHexString()
        );

        await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildPayload(
                    MSmartConst.SETTING.SET_DOCK_INTERVALS,
                    Buffer.from([
                        0x01, // Auto-empty interval
                        newInterval === AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL ? 1 : 3
                    ])
                )
            }).toHexString()
        );
    }

    getProperties() {
        return {
            supportedIntervals: [
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT,
            ]
        };
    }
}

module.exports = MideaAutoEmptyDockAutoEmptyIntervalControlCapability;
