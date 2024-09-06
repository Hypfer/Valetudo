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
                            case 3: {
                                // 3 is a reminder to reset the consumable if a _new_ cartridge was installed
                                // It kinda probably behaves the same as 1, but for good measure, we shall do
                                // what the vendor app does and also set it to 1 as soon as we see it

                                await this.helper.writeProperty(
                                    DreameMiotServices["GEN2"].VACUUM_2.SIID,
                                    DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_DETERGENT.PIID,
                                    1
                                );

                                return "on";
                            }

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
                    title: "Edge Extension: Twist",
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
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING:
                return new Quirk({
                    id: id,
                    title: "Edge Extension: Mop",
                    description: "Enhance mopping coverage at the outlines by moving the mop outwards.",
                    options: ["automatic", "each_cleanup", "every_7_days", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.MopScalable) {
                            case -7:
                            case -2:
                            case -1:
                                return "off";
                            case 1:
                                return "automatic";
                            case 2:
                                return "each_cleanup";
                            case 7:
                                return "every_7_days";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.MopScalable}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "off":
                                val = -2;
                                break;
                            case "automatic":
                                val = 1;
                                break;
                            case "each_cleanup":
                                val = 2;
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
                                MopScalable: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING_TWIST:
                return new Quirk({
                    id: id,
                    title: "Edge Extension: Mop and twist",
                    description: "When \"Edge Extension: Mop\" is enabled, twist the robot to further reach below furniture with overhangs.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.LacuneMopScalable) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.LacuneMopScalable}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                LacuneMopScalable: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING_FURNITURE_LEGS:
                return new Quirk({
                    id: id,
                    title: "Edge Extension: Mop for furniture legs",
                    description: "When \"Edge Extension: Mop\" is enabled, also use it to better clean around small pillars like table legs.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.MopScalable2) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.MopScalable2}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                MopScalable2: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WATER_HEATER:
                return new Quirk({
                    id: id,
                    title: "Mop Dock Water Heater",
                    description: "When enabled, the dock will heat the water used to rinse the mop pads.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.HotWash) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.HotWash}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                HotWash: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_HIGH_RES_WATER_HEATER:
                return new Quirk({
                    id: id,
                    title: "Mop Dock Water Heater",
                    description: "Select if and how much the dock should heat the water used to rinse the mop pads.",
                    options: ["high", "medium", "low", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].MOP_EXPANSION.SIID,
                            DreameMiotServices["GEN2"].MOP_EXPANSION.PROPERTIES.HIGH_RES_MOP_DOCK_HEATER.PIID
                        );

                        switch (res) {
                            case 3:
                                return "high";
                            case 2:
                                return "medium";
                            case 1:
                                return "low";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${res}`);
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
                            case "off":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].MOP_EXPANSION.SIID,
                            DreameMiotServices["GEN2"].MOP_EXPANSION.PROPERTIES.HIGH_RES_MOP_DOCK_HEATER.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.EDGE_EXTENSION_FREQUENCY:
                return new Quirk({
                    id: id,
                    title: "Edge Extension: Frequency",
                    description: "Select when/how often mop and side brush (each when enabled) should be extended to increase coverage in corners and close to walls.",
                    options: ["automatic", "each_cleanup", "every_7_days"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.ExtrFreq) {
                            case 1:
                                return "automatic";
                            case 2:
                                return "each_cleanup";
                            case 7:
                                return "every_7_days";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.ExtrFreq}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "automatic":
                                val = 1;
                                break;
                            case "each_cleanup":
                                val = 2;
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
                                ExtrFreq: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.CARPET_DETECTION_AUTO_DEEP_CLEANING:
                return new Quirk({
                    id: id,
                    title: "Deep carpet cleaning",
                    description: "When enabled, the robot will automatically clean detected carpets with two slower passes in alternating directions.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.CarpetFineClean) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.CarpetFineClean}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                CarpetFineClean: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WATER_USAGE:
                return new Quirk({
                    id: id,
                    title: "Mop Dock Mop Wash Intensity",
                    description: "Higher settings mean more water and longer wash cycles.",
                    options: ["low", "medium", "high"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_WATER_USAGE.PIID
                        );

                        switch (res) {
                            case 2:
                                return "high";
                            case 1:
                                return "medium";
                            case 0:
                                return "low";
                            default:
                                throw new Error(`Received invalid intensity ${res}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "high":
                                val = 2;
                                break;
                            case "medium":
                                val = 1;
                                break;
                            case "low":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid intensity ${value}`);
                        }

                        return this.helper.writeProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DOCK_WATER_USAGE.PIID,
                            val
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.SIDE_BRUSH_EXTEND:
                return new Quirk({
                    id: id,
                    title: "Edge Extension: Side Brush",
                    description: "Automatically extend the side brush to further reach into corners or below furniture",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.SbrushExtrSwitch) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.SbrushExtrSwitch}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                SbrushExtrSwitch: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.MOP_EXTEND_EDGE_MOPPING_V2:
                return new Quirk({
                    id: id,
                    title: "Edge Extension: Mop",
                    description: "Enhance mopping coverage at the outlines by moving the mop outwards.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);

                        switch (deserializedResponse.MopExtrSwitch) {
                            case 0:
                                return "off";
                            case 1: {
                                return "on";
                            }
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.MopExtrSwitch}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                MopExtrSwitch: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.CAMERA_LIGHT:
                return new Quirk({
                    id: id,
                    title: "Camera light",
                    description: "Use the inbuilt LED light to help the AI obstacle avoidance in low light conditions",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
                        );

                        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);
                        switch (deserializedResponse.FillinLight) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${deserializedResponse.FillinLight}`);
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                FillinLight: val
                            })
                        );
                    }
                });
            case DreameQuirkFactory.KNOWN_QUIRKS.DETACH_MOPS:
                return new Quirk({
                    id: id,
                    title: "Detach Mops",
                    description: "When enabled, the robot will leave the mop pads in the dock when running a vacuum-only cleanup",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.helper.readProperty(
                            DreameMiotServices["GEN2"].VACUUM_2.SIID,
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DETACH.PIID
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
                            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DETACH.PIID,
                            val
                        );
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
    MOP_DOCK_MOP_ONLY_MODE: "6afbb882-c4c4-4672-b008-887454e6e0d1",
    MOP_DOCK_MOP_CLEANING_FREQUENCY: "a6709b18-57af-4e11-8b4c-8ae33147ab34",
    MOP_DOCK_UV_TREATMENT: "7f97b603-967f-44f0-9dfb-35bcdc21f433",
    MOP_DRYING_TIME: "516a1025-9c56-46e0-ac9b-a5007088d24a",
    MOP_DOCK_DETERGENT: "a2a03d42-c710-45e5-b53a-4bc62778589f",
    MOP_DOCK_WET_DRY_SWITCH: "66adac0f-0a16-4049-b6ac-080ef702bb39",
    MOP_DOCK_AUTO_REPAIR_TRIGGER: "ae753798-aa4f-4b35-a60c-91e7e5ae76f3",
    MOP_DOCK_AUTO_DRYING: "6efc4d62-b5a4-474e-b353-5746a99ee8f9",
    EDGE_MOPPING: "7c71db1b-72b6-402e-89a4-d66c72cb9c8c",
    DRAIN_INTERNAL_WATER_TANK: "3e1b0851-3a5a-4943-bea6-dea3d7284bff",
    MOP_EXTEND_EDGE_MOPPING: "5e1bbac8-78d1-433e-9868-4229463e2761",
    MOP_EXTEND_EDGE_MOPPING_V2: "0c6dd70d-4a42-4400-a9ea-d4743015edbd",
    MOP_EXTEND_EDGE_MOPPING_TWIST: "3759ae19-3723-4aad-a55e-4f9d8078185d",
    MOP_EXTEND_EDGE_MOPPING_FURNITURE_LEGS: "08658d53-5d7b-4bfd-a179-25ceb3c70fe2",
    MOP_DOCK_WATER_HEATER: "d6f07d8a-5708-478e-925f-42db1b58d016",
    MOP_DOCK_HIGH_RES_WATER_HEATER: "68c10990-8e38-4d79-8ef4-84a506752b0e",
    CARPET_DETECTION_AUTO_DEEP_CLEANING: "9450a668-88d7-4ff3-9455-a78b485fb33b",
    MOP_DOCK_WATER_USAGE: "2d4ce805-ebf7-4dcf-b919-c5fe4d4f2de3",
    SIDE_BRUSH_EXTEND: "e560d60c-76de-4ccc-8c01-8ccbcece850e",
    EDGE_EXTENSION_FREQUENCY: "8f6a7013-794e-40d9-9bbe-8fdeed7c0b9d",
    CAMERA_LIGHT: "bba079c2-293b-4ad5-99b8-4102a1220b12",
    DETACH_MOPS: "4a52e16b-3c73-479d-b308-7f0bbdde0884"
};

module.exports = DreameQuirkFactory;
