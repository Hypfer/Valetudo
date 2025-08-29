const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

const entities = require("../../../entities");

const stateAttrs = entities.state.attributes;

/**
 * @extends BasicControlCapability<import("../MideaValetudoRobot")>
 */
class MideaBasicControlCapability extends BasicControlCapability {
    /**
     * @param {object} options
     * @param {import("../MideaValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);
    }

    async start() {
        const StatusStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);
        let command = 4;

        if (
            StatusStateAttribute &&
            StatusStateAttribute.value === stateAttrs.StatusStateAttribute.VALUE.PAUSED
        ) {
            command = 6;
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_WORK_STATUS,
                Buffer.from([
                    command //4 for a new one, 6 when paused to resume
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }

    async stop() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_WORK_STATUS,
                Buffer.from([7])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }

    async pause() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_WORK_STATUS,
                Buffer.from([5])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }

    async home() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_WORK_STATUS,
                Buffer.from([1]) // TODO: perhaps pull into const or from const? These are the same as the status
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }
}

module.exports = MideaBasicControlCapability;
