const Quirk = require("../../core/Quirk");

class RoborockQuirkFactory {
    /**
     *
     * @param {object} options
     * @param {import("./RoborockValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
    }
    /**
     * @param {string} id
     */
    getQuirk(id) {
        switch (id) {
            case RoborockQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_DURATION:
                return new Quirk({
                    id: id,
                    title: "Auto Empty Duration",
                    description: "Set the dustbin emptying duration when triggered by robot after docking.",
                    options: ["smart", "quick", "daily", "max"],
                    getter: async() => {
                        const res = await this.robot.sendCommand("get_dust_collection_mode", [], {});

                        switch (res?.mode) {
                            case 4:
                                return "max";
                            case 2:
                                return "daily";
                            case 1:
                                return "quick";
                            case 0:
                                return "smart";
                            default:
                                throw new Error(`Received invalid value ${res?.mode}`);
                        }
                    },
                    setter: async(value) => {
                        let val;

                        switch (value) {
                            case "max":
                                val = 4;
                                break;
                            case "daily":
                                val = 2;
                                break;
                            case "quick":
                                val = 1;
                                break;
                            case "smart":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.robot.sendCommand("set_dust_collection_mode", { "mode": val }, {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.BUTTON_LEDS:
                return new Quirk({
                    id: id,
                    title: "Button LEDs",
                    description: "Setting this to \"off\" will turn off the button LEDs of the robot when it is docked and fully charged.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.robot.sendCommand("get_led_status", [], {});

                        switch (res?.[0]) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${res?.[0]}`);
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

                        return this.robot.sendCommand("set_led_status", [val], {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.STATUS_LED:
                return new Quirk({
                    id: id,
                    title: "Status LED",
                    description: "Setting this to \"off\" will turn off the status indicator LED.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.robot.sendCommand("get_flow_led_status", [], {});

                        switch (res?.status) {
                            case 1:
                                return "on";
                            case 0:
                                return "off";
                            default:
                                throw new Error(`Received invalid value ${res?.status}`);
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

                        return this.robot.sendCommand("set_flow_led_status", {"status": val}, {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.CARPET_HANDLING:
                return new Quirk({
                    id: id,
                    title: "Carpet Handling",
                    description: "Select how the robot should deal with carpet detected by a dedicated sensor when the mop is attached",
                    options: ["raise_mop", "avoid", "ignore"],
                    getter: async() => {
                        const res = await this.robot.sendCommand("get_carpet_clean_mode", [], {});

                        switch (res?.[0]?.carpet_clean_mode) {
                            case 2:
                                return "ignore";
                            case 1:
                                return "raise_mop";
                            case 0:
                                return "avoid";
                            default:
                                throw new Error(`Received invalid value ${res?.[0]?.carpet_clean_mode}`);
                        }
                    },
                    setter: async(value) => {
                        let val;

                        switch (value) {
                            case "ignore":
                                val = 2;
                                break;
                            case "raise_mop":
                                val = 1;
                                break;
                            case "avoid":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.robot.sendCommand("set_carpet_clean_mode", { "carpet_clean_mode": val }, {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.MOP_PATTERN:
                return new Quirk({
                    id: id,
                    title: "Mop Pattern",
                    description: "Select which movement mode to use while mopping",
                    options: ["standard", "deep", "deep_plus"],
                    getter: async () => {
                        const res = await this.robot.sendCommand("get_mop_mode", [], {});

                        switch (res?.[0]) {
                            case 300:
                                return "standard";
                            case 301:
                                return "deep";
                            case 303:
                                return "deep_plus";
                            default:
                                throw new Error(`Received invalid value ${res?.[0]}`);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "standard":
                                val = 300;
                                break;
                            case "deep":
                                val = 301;
                                break;
                            case "deep_plus":
                                val = 303;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.robot.sendCommand("set_mop_mode", [val], {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.MANUAL_MAP_SEGMENT_TRIGGER:
                return new Quirk({
                    id: id,
                    title: "Manual map segment trigger",
                    description: "If you only see a blue map without segments, you can try to manually trigger map segmentation using this quirk.",
                    options: ["select_to_trigger", "trigger"],
                    getter: async () => {
                        return "select_to_trigger";
                    },
                    setter: async (value) => {
                        if (value === "trigger") {
                            await this.robot.sendCommand("manual_segment_map", [], {timeout: 10000});

                            this.robot.pollMap();
                        }
                    }
                });
            default:
                throw new Error(`There's no quirk with id ${id}`);
        }
    }
}

RoborockQuirkFactory.KNOWN_QUIRKS = {
    AUTO_EMPTY_DURATION: "7e33281f-d1bd-4e11-a100-b2c792284883",
    BUTTON_LEDS: "57ffd1d3-306e-4451-b89c-934ec917fe7e",
    STATUS_LED: "1daf5179-0689-48a5-8f1b-0a23e11836dc",
    CARPET_HANDLING: "070c07ef-e35b-476f-9f80-6a286fef1a48",
    MOP_PATTERN: "767fc859-3383-4485-bfdf-7aa800cf487e",
    MANUAL_MAP_SEGMENT_TRIGGER: "3e467ac1-7d14-4e66-b09b-8d0554a3194e",
};

module.exports = RoborockQuirkFactory;
