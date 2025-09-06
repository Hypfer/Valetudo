const BEightParser = require("../../msmart/BEightParser");
const MSmartCleaningSettings1DTO = require("../../msmart/dtos/MSmartCleaningSettings1DTO");
const MSmartConst = require("../../msmart/MSmartConst");
const MSmartPacket = require("../../msmart/MSmartPacket");
const Quirk = require("../../core/Quirk");

class MideaQuirkFactory {
    /**
     *
     * @param {object} options
     * @param {import("./MideaValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
    }
    /**
     * @param {string} id
     */
    getQuirk(id) {
        switch (id) {
            case MideaQuirkFactory.KNOWN_QUIRKS.HAIR_CUTTING:
                return new Quirk({
                    id: id,
                    title: "Hair Cutting",
                    description: "Control the hair cutting cycle that runs once docked after a cleanup.",
                    options: ["off", "normal", "strong"],
                    getter: async () => {
                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CLEANING_SETTINGS_1)
                        });

                        const response = await this.robot.sendCommand(packet.toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCleaningSettings1DTO) {
                            switch (parsedResponse.cut_hair_level) {
                                case 0:
                                    return "off";
                                case 1:
                                    return "normal";
                                case 2:
                                    return "strong";
                            }
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "off":
                                val = 0;
                                break;
                            case "normal":
                                val = 1;
                                break;
                            case "strong":
                                val = 2;
                                break;
                            default:
                                throw new Error(`Invalid hair cutting value: ${value}`);
                        }

                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_CLEANING_SETTINGS_1,
                                Buffer.from([0x01, val])
                            )
                        });

                        await this.robot.sendCommand(packet.toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.HAIR_CUTTING_ONE_TIME_TURBO:
                return new Quirk({
                    id: id,
                    title: "Hair Cutting Turbo",
                    description: "Enabling this will run an even stronger hair cutting cycle on the next cleanup. Disables itself afterwards.",
                    options: ["off", "on"],
                    getter: async () => {
                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CLEANING_SETTINGS_1)
                        });

                        const response = await this.robot.sendCommand(packet.toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCleaningSettings1DTO) {
                            return parsedResponse.cut_hair_super_switch ? "on" : "off";
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "off":
                                val = 0;
                                break;
                            case "on":
                                val = 1;
                                break;
                            default:
                                throw new Error(`Invalid super hair cutting value: ${value}`);
                        }

                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_CLEANING_SETTINGS_1,
                                Buffer.from([0x06, val])
                            )
                        });

                        await this.robot.sendCommand(packet.toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.AI_OBSTACLE_CLASSIFICATION:
                return new Quirk({
                    id: id,
                    title: "AI Obstacle Classification",
                    description: "Controls whether and how hard the robot should try to actually understand and work around the encountered obstacles.",
                    options: ["off", "high", "normal"],
                    getter: async () => {
                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CLEANING_SETTINGS_1)
                        });

                        const response = await this.robot.sendCommand(packet.toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCleaningSettings1DTO) {
                            switch (parsedResponse.ai_grade_avoidance_mode) {
                                case 0:
                                    return "off";
                                case 1:
                                    return "high";
                                case 2:
                                    return "normal";
                            }
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "off":
                                val = 0;
                                break;
                            case "high":
                                val = 1;
                                break;
                            case "normal":
                                val = 2;
                                break;
                            default:
                                throw new Error(`Invalid obstacle avoidance sensitivity value: ${value}`);
                        }

                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                                Buffer.from([
                                    0x15, // super-obstacle
                                    val
                                ])
                            )
                        });

                        await this.robot.sendCommand(packet.toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.QUIET_AUTO_EMPTY:
                return new Quirk({
                    id: id,
                    title: "Quiet Auto Empty",
                    description: "Reduces the noise level during the auto-empty process. Will also make it less effective.",
                    options: ["normal", "quiet"],
                    getter: async () => {
                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CLEANING_SETTINGS_1)
                        });

                        const response = await this.robot.sendCommand(packet.toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCleaningSettings1DTO) {
                            switch (parsedResponse.collect_suction_level) {
                                case 0:
                                    return "normal";
                                case 1:
                                    return "quiet";
                            }
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "normal":
                                val = 0;
                                break;
                            case "quiet":
                                val = 1;
                                break;
                            default:
                                throw new Error(`Invalid quiet auto empty value: ${value}`);
                        }

                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_CLEANING_SETTINGS_1,
                                Buffer.from([
                                    0x04, // CollectSuctionLevel
                                    val
                                ])
                            )
                        });

                        await this.robot.sendCommand(packet.toHexString());
                    }
                });
            default:
                throw new Error(`There's no quirk with id ${id}`);
        }
    }
}

MideaQuirkFactory.KNOWN_QUIRKS = {
    HAIR_CUTTING: "afa83002-87db-43bb-b8ff-e4b38863a5d3",
    HAIR_CUTTING_ONE_TIME_TURBO: "224b6a0a-1a51-48d7-9d4d-61645399d368",
    AI_OBSTACLE_CLASSIFICATION: "75af01c4-5c24-4cb3-9619-41b46b6ce333",
    QUIET_AUTO_EMPTY: "96a98473-d60c-4ed9-8ef4-b71f023085a0",
};

module.exports = MideaQuirkFactory;
