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
            case RoborockQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_LENGTH:
                return new Quirk({
                    id: id,
                    title: "Auto Empty Duration",
                    description: "Set the dustbin emptying duration when triggered by robot after docking.",
                    options: ["Smart", "Quick", "Daily", "Max"],
                    getter: async() => {
                        const res = await this.robot.sendCommand("get_dust_collection_mode", [], {});

                        if (!(res && res.mode !== undefined)) {
                            throw new Error(`Received invalid response: ${res}`);
                        } else {
                            switch (res.mode) {
                                case 4:
                                    return "Max";
                                case 2:
                                    return "Daily";
                                case 1:
                                    return "Quick";
                                case 0:
                                    return "Smart";
                                default:
                                    throw new Error(`Received invalid value ${res.status}`);
                            }
                        }


                    },
                    setter: async(value) => {
                        let val;

                        switch (value) {
                            case "Max":
                                val = 4;
                                break;
                            case "Daily":
                                val = 2;
                                break;
                            case "Quick":
                                val = 1;
                                break;
                            case "Smart":
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

                        if (!(Array.isArray(res) && res.length === 1)) {
                            throw new Error(`Received invalid response: ${res}`);
                        } else {
                            switch (res[0]) {
                                case 1:
                                    return "on";
                                case 0:
                                    return "off";
                                default:
                                    throw new Error(`Received invalid value ${res}`);
                            }
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

                        if (!(res && res.status !== undefined)) {
                            throw new Error(`Received invalid response: ${res}`);
                        } else {
                            switch (res.status) {
                                case 1:
                                    return "on";
                                case 0:
                                    return "off";
                                default:
                                    throw new Error(`Received invalid value ${res.status}`);
                            }
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
            default:
                throw new Error(`There's no quirk with id ${id}`);
        }
    }
}

RoborockQuirkFactory.KNOWN_QUIRKS = {
    AUTO_EMPTY_LENGTH: "7e33281f-d1bd-4e11-a100-b2c792284883",
    BUTTON_LEDS: "57ffd1d3-306e-4451-b89c-934ec917fe7e",
    STATUS_LED: "1daf5179-0689-48a5-8f1b-0a23e11836dc"
};

module.exports = RoborockQuirkFactory;
