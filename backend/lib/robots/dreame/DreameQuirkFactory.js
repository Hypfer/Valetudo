const DreameMiotHelper = require("./DreameMiotHelper");
const DreameMiotServices = require("./DreameMiotServices");
const DreameUtils = require("./DreameUtils");
const Quirk = require("../../core/Quirk");

class DreameQuirkFactory {
    /**
     *
     * @param {object} options
     * @param {import("./DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
        this.helper = new DreameMiotHelper({robot: this.robot});
    }
    /**
     * @param {string} id
     */
    getQuirk(id) {
        switch (id) {
            case DreameQuirkFactory.KNOWN_QUIRKS.CARPET_MODE_SENSITIVITY:
                return new Quirk({
                    id: id,
                    title: "Carpet Mode Sensitivity",
                    description: "Depending on the type of carpet in your home, the carpet mode might not trigger as expected. This tunable can help in these situations.",
                    options: ["low", "medium", "high"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.CARPET_MODE_SENSITIVITY.PIID
                        );

                        switch (res) {
                            case 3:
                                return "high";
                            case 2:
                                return "medium";
                            case 1:
                                return "low";
                            default:
                                throw new Error(`Received invalid sensitivity ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "high":
                                val = 3;
                                break;
                            case "medium":
                                val = 2;
                                break;
                            case "low":
                                val = 1;
                                break;
                            default:
                                throw new Error(`Received invalid sensitivity ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.CARPET_MODE_SENSITIVITY.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.TIGHT_MOP_PATTERN:
                return new Quirk({
                    id: id,
                    title: "Tight Mop Pattern",
                    description: "Enabling this makes your robot move in a much tighter pattern when mopping.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.TIGHT_MOP_PATTERN.PIID
                        );

                        switch (res) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "on":
                                val = 1;
                                break;
                            case "off":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.TIGHT_MOP_PATTERN.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_INTERVAL:
                return new Quirk({
                    id: id,
                    title: "Auto-empty Interval",
                    description: "Depending on the size of your home, you might not need to auto-empty the dustbin on " +
                        "every single cleanup. Note that you can also disable auto-empty entirely and manually trigger " +
                        "it via REST and/or MQTT instead of changing the interval.",
                    options: ["every_cleanup", "every_second_cleanup", "every_third_cleanup"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.SIID,
                            DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.INTERVAL.PIID
                        );

                        switch (res) {
                            case 1:
                                return "every_cleanup";
                            case 2:
                                return "every_second_cleanup";
                            case 3:
                                return "every_third_cleanup";
                            default:
                                throw new Error(`Received invalid value ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "every_cleanup":
                                val = 1;
                                break;
                            case "every_second_cleanup":
                                val = 2;
                                break;
                            case "every_third_cleanup":
                                val = 3;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.SIID,
                            DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.INTERVAL.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_ONLY_MODE:
                return new Quirk({
                    id: id,
                    title: "Mop Only",
                    description: "Disable the vacuum functionality when the mop pads are attached.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(res);

                        switch (deserializedResponse.operationMode) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.operationMode}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "on":
                                val = 1;
                                break;
                            case "off":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
                        );
                        const deserializedResponse = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(res);

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID,
                            DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
                                waterGrade: deserializedResponse.waterGrade,
                                padCleaningFrequency: deserializedResponse.padCleaningFrequency,
                                operationMode: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY:
                return new Quirk({
                    id: id,
                    title: "Mop Cleaning Frequency",
                    description: "Determine how often the robot should clean and re-wet its mopping pads during a cleanup.",
                    options: ["every_segment", "every_5_m2", "every_10_m2", "every_15_m2", "every_20_m2", "every_25_m2"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(res);

                        switch (deserializedResponse.padCleaningFrequency) {
                            case 0:
                                return "every_segment";
                            case 5:
                                return "every_5_m2";
                            case 10:
                                return "every_10_m2";
                            case 15:
                                return "every_15_m2";
                            case 20:
                                return "every_20_m2";
                            case 25:
                                return "every_25_m2";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.operationMode}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "every_segment":
                                val = 0;
                                break;
                            case "every_5_m2":
                                val = 5;
                                break;
                            case "every_10_m2":
                                val = 10;
                                break;
                            case "every_15_m2":
                                val = 15;
                                break;
                            case "every_20_m2":
                                val = 20;
                                break;
                            case "every_25_m2":
                                val = 25;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID
                        );
                        const deserializedResponse = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(res);

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_SETTINGS.PIID,
                            DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
                                waterGrade: deserializedResponse.waterGrade,
                                padCleaningFrequency: val,
                                operationMode: deserializedResponse.operationMode
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_UV_TREATMENT:
                return new Quirk({
                    id: id,
                    title: "Wastewater UV Treatment",
                    description: "Disinfect the waste water tank after each successful cleanup using the in-built UV-C light.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_UV_TREATMENT.PIID
                        );

                        switch (res) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "on":
                                val = 1;
                                break;
                            case "off":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_UV_TREATMENT.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DRYING_TIME:
                return new Quirk({
                    id: id,
                    title: "Mop Drying Time",
                    description: "Define how long the mop should be dried after a cleanup",
                    options: ["2h", "3h", "4h"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DRYING_TIME.PIID
                        );

                        switch (res) {
                            case 2:
                                return "2h";
                            case 3:
                                return "3h";
                            case 4:
                                return "4h";
                            default:
                                throw new Error(`Received invalid value ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "2h":
                                val = 2;
                                break;
                            case "3h":
                                val = 3;
                                break;
                            case "4h":
                                val = 4;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DRYING_TIME.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_DETERGENT:
                return new Quirk({
                    id: id,
                    title: "Detergent",
                    description: "Select if the Dock should automatically add detergent to the water",
                    options: ["on", "off", "Missing detergent cartridge"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_DETERGENT.PIID
                        );

                        switch (res) {
                            case 0:
                                return "off";
                            case 1:
                                return "on";
                            case 2:
                                return "Missing detergent cartridge";
                            case 3:
                                return "off"; // apparently means it was depleted at some point? weird.
                            default:
                                throw new Error(`Received invalid value ${res}`);
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
                            case "Missing detergent cartridge":
                                throw new Error("This informational message is not a user-selectable option");
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_DETERGENT.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WET_DRY_SWITCH:
                return new Quirk({
                    id: id,
                    title: "Pre-Wet Mops",
                    description: "Select \"dry\" if you don't want the dock to wet the mops before cleaning. This can be useful if there's a spill that you want to mop up.",
                    options: ["Wet", "Dry"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_WET_DRY_SWITCH.PIID
                        );

                        switch (res) {
                            case 1:
                                return "Wet";
                            case 0:
                                return "Dry";
                            default:
                                throw new Error(`Received invalid value ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "Wet":
                                val = 1;
                                break;
                            case "Dry":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_WET_DRY_SWITCH.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_AUTO_REPAIR_TRIGGER:
                return new Quirk({
                    id: id,
                    title: "Mop Dock Auto Repair",
                    description: "If the mops don't stay wet during cleaning, there might be air in the system," +
                        "preventing the water tank in the robot from being filled. In that case, try running this a few times.",
                    options: ["select_to_trigger", "trigger"],
                    getter: async () => {
                        return "select_to_trigger";
                    },
                    setter: async (value) => {
                        if (value === "trigger") {
                            return this.helper.writeProperty(
                                99,
                                8,
                                JSON.stringify({ "bittest": [19, 0] })
                            );
                        }
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_AUTO_DRYING:
                return new Quirk({
                    id: id,
                    title: "Mop Auto drying",
                    description: "Select if the dock should automatically dry the mop after a cleanup",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.AutoDry) {
                            case 0:
                                return "off";
                            case 1:
                                return "on";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.AutoDry}`);
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
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                AutoDry: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.EDGE_MOPPING:
                return new Quirk({
                    id: id,
                    title: "Edge mopping",
                    description: "Enhance mopping coverage at the outlines by rotating the robot. " +
                        "Greatly increases the cleanup duration. " +
                        "Settings other than \"each_cleanup\" or \"off\" will only apply to full cleanups.",
                    options: ["each_cleanup", "every_7_days", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.MeticulousTwist) {
                            case -7:
                            case -1:
                                return "off";
                            case 1:
                                return "each_cleanup";
                            case 7:
                                return "every_7_days";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.MeticulousTwist}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "off":
                                val = -1;
                                break;
                            case "each_cleanup":
                                val = 1;
                                break;
                            case "every_7_days":
                                val = 7;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                MeticulousTwist: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.DRAIN_INTERNAL_WATER_TANK:
                return new Quirk({
                    id: id,
                    title: "Drain internal water tank",
                    description: "Drain the internal water tank of the robot into the dock. " +
                        "This can be useful if the robot is to be transported or stored for a while. May take up to 3 minutes.",
                    options: ["select_to_trigger", "trigger"],
                    getter: async () => {
                        return "select_to_trigger";
                    },
                    setter: async (value) => {
                        if (value === "trigger") {
                            await this.helper.executeAction(
                                DreameMiotServices["GEN2"].VACUUM_2.SIID,
                                DreameMiotServices["GEN2"].VACUUM_2.ACTIONS.MOP_DOCK_INTERACT.AIID,
                                [
                                    {
                                        piid: DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID,
                                        value: "7,1"
                                    }
                                ]
                            );
                        }
                    }
                });
            default:
                throw new Error(`There's no quirk with id ${id}`);
        }
    }
}

DreameQuirkFactory.KNOWN_QUIRKS = {
    CARPET_MODE_SENSITIVITY: "f8cb91ab-a47a-445f-b300-0aac0d4937c0",
    TIGHT_MOP_PATTERN: "8471c118-f1e1-4866-ad2e-3c11865a5ba8",
    AUTO_EMPTY_INTERVAL: "d38118f2-fb5d-4ed9-b668-262db15e5269",
    MOP_DOCK_MOP_ONLY_MODE: "6afbb882-c4c4-4672-b008-887454e6e0d1",
    MOP_DOCK_MOP_CLEANING_FREQUENCY: "a6709b18-57af-4e11-8b4c-8ae33147ab34",
    MOP_DOCK_UV_TREATMENT: "7f97b603-967f-44f0-9dfb-35bcdc21f433",
    MOP_DRYING_TIME: "516a1025-9c56-46e0-ac9b-a5007088d24a",
    MOP_DOCK_DETERGENT: "a2a03d42-c710-45e5-b53a-4bc62778589f",
    MOP_DOCK_WET_DRY_SWITCH: "66adac0f-0a16-4049-b6ac-080ef702bb39",
    MOP_DOCK_AUTO_REPAIR_TRIGGER: "ae753798-aa4f-4b35-a60c-91e7e5ae76f3",
    MOP_DOCK_AUTO_DRYING: "6efc4d62-b5a4-474e-b353-5746a99ee8f9",
    EDGE_MOPPING: "7c71db1b-72b6-402e-89a4-d66c72cb9c8c",
    DRAIN_INTERNAL_WATER_TANK: "3e1b0851-3a5a-4943-bea6-dea3d7284bff"
};

module.exports = DreameQuirkFactory;
