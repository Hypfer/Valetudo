const Quirk = require("../../core/Quirk");

class ViomiQuirkFactory {
    /**
     *
     * @param {object} options
     * @param {import("./ViomiValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
    }
    /**
     * @param {string} id
     */
    getQuirk(id) {
        switch (id) {
            case ViomiQuirkFactory.KNOWN_QUIRKS.BUTTON_LEDS:
                return new Quirk({
                    id: id,
                    title: "Button LEDs",
                    description: "Setting this to \"off\" will turn off the button LEDs.",
                    options: ["on", "off"],
                    getter: async () => {
                        const res = await this.robot.sendCommand("get_prop", ["light_state"], {});

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

                        return this.robot.sendCommand("set_light", [val], {});
                    }
                });
            default:
                throw new Error(`There's no quirk with id ${id}`);
        }
    }
}

ViomiQuirkFactory.KNOWN_QUIRKS = {
    BUTTON_LEDS: "977c5972-1f12-4ef1-9622-ce71fd085193"
};

module.exports = ViomiQuirkFactory;
