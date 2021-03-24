const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");
const fs = require("fs");
const readline = require("readline");

/**
 * @extends CarpetModeControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiCarpetModeControlCapability extends CarpetModeControlCapability {
    /**
     * @param {object} options
     * @param {import("../ViomiValetudoRobot")} options.robot
     * @param {string} [options.carpetConfigFile]
     */
    constructor(options) {
        super(options);
        this.carpetConfigPath = options.carpetConfigFile;
        this.carpetModeEnabled = null;
    }

    /**
     * This function returns the last set carpet turbo mode setting..
     * Viomi does not have a command to retrieve the current setting, so we fail if it was not set recently.
     *
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        // Disclaimer: nasty
        // noinspection JSUnresolvedVariable
        const state = this.carpetModeEnabled;
        if (state !== null && state !== undefined) {
            return state;
        }

        if (this.robot.config.get("embedded") === true && this.carpetConfigPath && fs.existsSync(this.carpetConfigPath)) {
            const fileStream = fs.createReadStream(this.carpetConfigPath);
            const lineReader = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            for await (const line of lineReader) {
                if (line.startsWith("m_carpet_turbo")) {
                    if (line.trim().endsWith("=1")) {
                        this.carpetModeEnabled = true;
                    } else if (line.endsWith("=0")) {
                        this.carpetModeEnabled = false;
                    } else {
                        break;
                    }
                    return this.carpetModeEnabled;
                }
            }
        }

        throw new Error("Carpet turbo state cannot be remembered by Valetudo. " +
            "If you don't remember what you set it to, set it again.");
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        this.carpetModeEnabled = true;
        // 0: off, 1: medium, 2: turbo
        await this.robot.sendCommand("set_carpetturbo", [2], {});
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        this.carpetModeEnabled = false;
        await this.robot.sendCommand("set_carpetturbo", [0], {});
    }
}

module.exports = ViomiCarpetModeControlCapability;
