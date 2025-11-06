const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

const entities = require("../../../entities");

const stateAttrs = entities.state.attributes;

/**
 * @extends BasicControlCapability<import("../MideaValetudoRobot")>
 */
class MideaBasicControlCapabilityV1 extends BasicControlCapability {
    /**
     * @param {object} options
     * @param {import("../MideaValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);
    }

    async start() {
        const StatusStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);
        const FanSpeedStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.FAN_SPEED
        });
        const WaterGradeAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.WATER_GRADE
        });

        const fanSpeed = FanSpeedStateAttribute?.metaData?.rawValue ?? 1;
        const waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;

        let packet;
        if (
            StatusStateAttribute &&
            StatusStateAttribute.value === stateAttrs.StatusStateAttribute.VALUE.PAUSED
        ) {
            packet = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.RESUME,
                        0x00,
                    ])
                )
            });
        } else {
            packet = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.START,
                        0x00,
                        0x02, // unclear what this means
                        0x00,
                        0x08, // Full cleanup
                        fanSpeed,
                        0x00, // unclear
                        waterGrade,
                        0x00,
                        0x00
                    ])
                )
            });
        }

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }

    async stop() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.STOP])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }

    async pause() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.PAUSE])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }

    async home() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.CHARGE])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        await this.robot.pollState(); // for good measure
    }
}

module.exports = MideaBasicControlCapabilityV1;
