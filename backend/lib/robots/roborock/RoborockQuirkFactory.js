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
                    description: "Select how long the dock should empty the dustbin on each auto empty cycle.",
                    options: ["auto", "short", "medium", "long"],
                    getter: async() => {
                        const res = await this.robot.sendCommand("get_dust_collection_mode", [], {});

                        switch (res?.mode) {
                            case 4:
                                return "long";
                            case 2:
                                return "medium";
                            case 1:
                                return "short";
                            case 0:
                                return "auto";
                            default:
                                throw new Error(`Received invalid value ${res?.mode}`);
                        }
                    },
                    setter: async(value) => {
                        let val;

                        switch (value) {
                            case "long":
                                val = 4;
                                break;
                            case "medium":
                                val = 2;
                                break;
                            case "short":
                                val = 1;
                                break;
                            case "auto":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.robot.sendCommand("set_dust_collection_mode", { "mode": val }, {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_MODE:
                return new Quirk({
                    id: id,
                    title: "Mop Dock Mop Cleaning Mode",
                    description: "Select how long the mop should be cleaned by the dock on each mop cleaning cycle.",
                    options: ["short", "medium", "long"],
                    getter: async() => {
                        const res = await this.robot.sendCommand("get_wash_towel_mode", [], {});

                        switch (res?.wash_mode) {
                            case 2:
                                return "long";
                            case 1:
                                return "medium";
                            case 0:
                                return "short";
                            default:
                                throw new Error(`Received invalid value ${res?.wash_mode}`);
                        }
                    },
                    setter: async(value) => {
                        let val;

                        switch (value) {
                            case "long":
                                val = 2;
                                break;
                            case "medium":
                                val = 1;
                                break;
                            case "short":
                                val = 0;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.robot.sendCommand("set_wash_towel_mode", { "wash_mode": val }, {});
                    }
                });
            case RoborockQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY:
                return new Quirk({
                    id: id,
                    title: "Mop Dock Mop Cleaning Frequency",
                    description: "Determine how often the robot should clean and re-wet its mop during a cleanup.",
                    options: [
                        "every_segment",
                        "every_5_min",
                        "every_10_min",
                        "every_15_min",
                        "every_20_min",
                        "every_30_min",
                        "every_45_min"
                    ],
                    getter: async() => {
                        const res = await this.robot.sendCommand("get_smart_wash_params", [], {});

                        if (res?.smart_wash === 0) {
                            switch (res.wash_interval) {
                                case 300:
                                    return "every_5_min";
                                case 600:
                                    return "every_10_min";
                                case 900:
                                    return "every_15_min";
                                case 1200:
                                    return "every_20_min";
                                case 1800:
                                    return "every_30_min";
                                case 2700:
                                    return "every_45_min";
                            }

                            // Fallback to return something if someone set values by other means
                            if (res.wash_interval < 300) {
                                return "every_5_min";
                            } else {
                                return "every_45_min";
                            }
                        } else if (res?.smart_wash === 1) {
                            return "every_segment";
                        } else {
                            throw new Error(`Received invalid value ${res}`);
                        }
                    },
                    setter: async(value) => {
                        let mode;
                        let interval;

                        switch (value) {
                            case "every_segment":
                                mode = 1;
                                interval = 1200;
                                break;
                            case "every_5_min":
                                mode = 0;
                                interval = 300;
                                break;
                            case "every_10_min":
                                mode = 0;
                                interval = 600;
                                break;
                            case "every_15_min":
                                mode = 0;
                                interval = 900;
                                break;
                            case "every_20_min":
                                mode = 0;
                                interval = 1200;
                                break;
                            case "every_30_min":
                                mode = 0;
                                interval = 1800;
                                break;
                            case "every_45_min":
                                mode = 0;
                                interval = 2700;
                                break;
                            default:
                                throw new Error(`Received invalid value ${value}`);
                        }

                        return this.robot.sendCommand("set_smart_wash_params", { "smart_wash": mode, wash_interval: interval }, {});
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
            case RoborockQuirkFactory.KNOWN_QUIRKS.MOP_PATTERN:
                return new Quirk({
                    id: id,
                    title: "Mop Pattern",
                    description: "Select which movement mode to use while mopping.",
                    options: ["standard", "deep"],
                    getter: async () => {
                        const res = await this.robot.sendCommand("get_mop_mode", [], {});

                        switch (res?.[0]) {
                            case 300:
                                return "standard";
                            case 301:
                                return "deep";
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
            case RoborockQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_AUTO_DRYING_TIME:
                return new Quirk({
                    id: id,
                    title: "Mop Auto Drying Time",
                    description: "Define how long the mop should be dried after a cleanup",
                    options: ["2h", "3h", "4h"],
                    getter: async () => {
                        const res = await this.robot.sendCommand("app_get_dryer_setting", [], {});

                        switch (res?.on.dry_time) {
                            case 2 * 60 * 60:
                                return "2h";
                            case 3 * 60 * 60:
                                return "3h";
                            case 4 * 60 * 60:
                                return "4h";
                            default:
                                return String(res.on.dry_time);
                        }
                    },
                    setter: async (value) => {
                        let val;

                        switch (value) {
                            case "2h":
                                val = 2 * 60 * 60;
                                break;
                            case "3h":
                                val = 3 * 60 * 60;
                                break;
                            case "4h":
                                val = 4 * 60 * 60;
                                break;
                            default:
                                val = Number(value);
                        }

                        return this.robot.sendCommand("app_set_dryer_setting", {"on": { "dry_time": val } }, {});
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
    MOP_PATTERN: "767fc859-3383-4485-bfdf-7aa800cf487e",
    MANUAL_MAP_SEGMENT_TRIGGER: "3e467ac1-7d14-4e66-b09b-8d0554a3194e",
    MOP_DOCK_MOP_CLEANING_FREQUENCY: "c50d98fb-7e29-4d09-a577-70c95ac33239",
    MOP_DOCK_MOP_CLEANING_MODE: "b4ca6500-a461-49cb-966a-4726a33ad3df",
    MOP_DOCK_AUTO_DRYING_TIME: "b6ad439c-6665-4ffd-a038-cc72821e5fb1"
};

module.exports = RoborockQuirkFactory;
