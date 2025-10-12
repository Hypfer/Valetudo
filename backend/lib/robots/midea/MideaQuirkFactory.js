const BEightParser = require("../../msmart/BEightParser");
const MSmartCarpetBehaviorSettingsDTO = require("../../msmart/dtos/MSmartCarpetBehaviorSettingsDTO");
const MSmartCleaningSettings1DTO = require("../../msmart/dtos/MSmartCleaningSettings1DTO");
const MSmartConst = require("../../msmart/MSmartConst");
const MSmartPacket = require("../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../msmart/dtos/MSmartStatusDTO");
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
                    title: "Quiet Auto-Empty",
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
            case MideaQuirkFactory.KNOWN_QUIRKS.CLIFF_SENSORS:
                return new Quirk({
                    id: id,
                    title: "Cliff Sensors",
                    description: "! DANGEROUS ! - This allows you to disable the cliff sensors. The robot WILL fall down stairs and possibly destroy itself if you do so.",
                    options: ["on", "off"],
                    getter: async () => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartStatusDTO) {
                            return parsedResponse.stairless_mode_switch ? "off" : "on";
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "off":
                                val = 1;
                                break;
                            case "on":
                                val = 0;
                                break;
                            default:
                                throw new Error("Invalid value");
                        }

                        await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_STAIRLESS_MODE,
                                Buffer.from([val])
                            )
                        }).toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.CARPET_FIRST:
                return new Quirk({
                    id: id,
                    title: "Carpet First",
                    description: "When enabled, the robot will first clean all carpet areas before then continuing with the rest of the cleanup.",
                    options: ["off", "on"],
                    getter: async () => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO) {
                            return parsedResponse.clean_carpet_first ? "on" : "off";
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (!(parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO)) {
                            throw new Error("Invalid response from robot");
                        }

                        let newParameterBitfield = parsedResponse.parameter_bitfield;
                        if (value === "on") {
                            newParameterBitfield = newParameterBitfield | MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.CLEAN_CARPET_FIRST;
                        } else {
                            newParameterBitfield = newParameterBitfield & ~MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.CLEAN_CARPET_FIRST;
                        }

                        await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_CARPET_BEHAVIOR_SETTINGS,
                                Buffer.from([
                                    parsedResponse.carpet_behavior,
                                    newParameterBitfield
                                ])
                            )
                        }).toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.DEEP_CARPET_CLEANING:
                return new Quirk({
                    id: id,
                    title: "Deep Carpet Cleaning",
                    description: "When enabled, the robot will automatically slowly clean detected carpets with twice the cleanup passes in alternating directions.",
                    options: ["off", "on"],
                    getter: async () => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO) {
                            return parsedResponse.deep_carpet_cleaning ? "on" : "off";
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (!(parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO)) {
                            throw new Error("Invalid response from robot");
                        }

                        let newParameterBitfield = parsedResponse.parameter_bitfield;
                        if (value === "on") {
                            newParameterBitfield = newParameterBitfield | MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.DEEP_CARPET_CLEANING;
                        } else {
                            newParameterBitfield = newParameterBitfield & ~MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.DEEP_CARPET_CLEANING;
                        }

                        await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_CARPET_BEHAVIOR_SETTINGS,
                                Buffer.from([
                                    parsedResponse.carpet_behavior,
                                    newParameterBitfield
                                ])
                            )
                        }).toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.INCREASED_CARPET_AVOIDANCE:
                return new Quirk({
                    id: id,
                    title: "Increased Carpet Avoidance",
                    description: "When enabled, when avoiding carpets, the robot will stay further away from them.",
                    options: ["off", "on"],
                    getter: async () => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO) {
                            return parsedResponse.enhanced_carpet_avoidance ? "on" : "off";
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async (value) => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (!(parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO)) {
                            throw new Error("Invalid response from robot");
                        }

                        let newParameterBitfield = parsedResponse.parameter_bitfield;
                        if (value === "on") {
                            newParameterBitfield = newParameterBitfield | MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.ENHANCED_CARPET_AVOIDANCE;
                        } else {
                            newParameterBitfield = newParameterBitfield & ~MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.ENHANCED_CARPET_AVOIDANCE;
                        }

                        await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_CARPET_BEHAVIOR_SETTINGS,
                                Buffer.from([
                                    parsedResponse.carpet_behavior,
                                    newParameterBitfield
                                ])
                            )
                        }).toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.STAIN_CLEANING:
                return new Quirk({
                    id: id,
                    title: "Stain Cleaning",
                    description: "When enabled, during a clean the robot will detect stains and spills and will exert special care. Note that due to optical similarities, this feature is mutually exclusive to the PetObstacleAvoidance.",
                    options: ["off", "on"],
                    getter: async () => {
                        const response = await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
                        }).toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartStatusDTO) {
                            return parsedResponse.stain_clean_switch ? "on" : "off";
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
                                throw new Error(`Invalid stain cleaning value: ${value}`);
                        }

                        await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                                Buffer.from([
                                    0x08, // Stain Cleaning
                                    val
                                ])
                            )
                        }).toHexString());
                    }
                });
            case MideaQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_DURATION:
                return new Quirk({
                    id: id,
                    title: "Auto Empty Duration",
                    description: "Select how long the dock should empty the dustbin on each auto empty cycle.",
                    options: ["short", "medium", "long"],
                    getter: async() => {
                        const packet = new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
                        });

                        const response = await this.robot.sendCommand(packet.toHexString());
                        const parsedResponse = BEightParser.PARSE(response);

                        if (parsedResponse instanceof MSmartStatusDTO) {
                            switch (parsedResponse.collect_dust_mode) {
                                case 3:
                                    return "long";
                                case 2:
                                    return "medium";
                                case 1:
                                    return "short";
                            }
                        } else {
                            throw new Error("Invalid response from robot");
                        }
                    },
                    setter: async(value) => {
                        let val;

                        switch (value) {
                            case "long":
                                val = 3;
                                break;
                            case "medium":
                                val = 2;
                                break;
                            case "short":
                                val = 1;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        await this.robot.sendCommand(new MSmartPacket({
                            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                            payload: MSmartPacket.buildPayload(
                                MSmartConst.SETTING.SET_AUTO_EMPTY_DURATION,
                                Buffer.from([val])
                            )
                        }).toHexString());
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
    CLIFF_SENSORS: "ef7a7a7f-370b-485d-80fb-704206a9b354",
    CARPET_FIRST: "4b100fec-08d5-4227-9edf-eb0198d6ea20",
    DEEP_CARPET_CLEANING: "d2ad3f99-c1b0-4195-9a98-4f13bdb0f1e8",
    INCREASED_CARPET_AVOIDANCE: "f3ff1c65-9fe7-4312-b196-83ce91107fe8",
    STAIN_CLEANING: "d4688a29-a6e4-43c2-ab3a-08ddae40655c",
    AUTO_EMPTY_DURATION: "ac39aac4-c798-43b4-88ee-e4847a799a84"
};

module.exports = MideaQuirkFactory;
