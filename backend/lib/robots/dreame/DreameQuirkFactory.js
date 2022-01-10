const DreameMiotHelper = require("./DreameMiotHelper");
const DreameMiotServices = require("./DreameMiotServices");
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
                    options: ["off", "on"],
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
                    description: "Depending on the size of your home, you might not need to auto-empty the dustbin on" +
                        "every single cleanup. Note that you can also disable auto-empty entirely and manually trigger" +
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
            default:
                throw new Error(`There's no quirk with id ${id}`);
        }
    }
}

DreameQuirkFactory.KNOWN_QUIRKS = {
    CARPET_MODE_SENSITIVITY: "f8cb91ab-a47a-445f-b300-0aac0d4937c0",
    TIGHT_MOP_PATTERN: "8471c118-f1e1-4866-ad2e-3c11865a5ba8",
    AUTO_EMPTY_INTERVAL: "d38118f2-fb5d-4ed9-b668-262db15e5269"
};

module.exports = DreameQuirkFactory;
