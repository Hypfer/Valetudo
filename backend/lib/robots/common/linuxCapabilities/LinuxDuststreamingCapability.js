const fs = require("fs");
const path = require("path");

const DuststreamerManager = require("../../../DuststreamerManager");
const DuststreamingCapability = require("../../../core/capabilities/DuststreamingCapability");

const BINARY_PATH = path.join(path.dirname(process.execPath), "duststreamer");

/**
 * @template {import("../../../core/ValetudoRobot")} T
 * @extends DuststreamingCapability<T>
 */
class LinuxDuststreamingCapability extends DuststreamingCapability {
    /**
     * @param {object} options
     * @param {T} options.robot
     * @param {string} options.platform
     * @param {string} options.device
     * @param {object} options.dimensions
     * @param {number} options.dimensions.width
     * @param {number} options.dimensions.height
     * @param {number} [options.framerate]
     * @param {number} [options.bitrate]
     */
    constructor(options) {
        super(options);

        this.manager = new DuststreamerManager({
            duststreamerPath: BINARY_PATH,
            platform: options.platform,
            device: options.device,
            width: options.dimensions.width,
            height: options.dimensions.height,
            framerate: options.framerate ?? 30,
            bitrate: options.bitrate ?? 1_000_000
        });
    }

    isDuststreamerInstalled() {
        try {
            return fs.existsSync(BINARY_PATH);
        } catch (e) {
            return false;
        }
    }

    register(subscriber) {
        this.manager.register(subscriber);
    }

    async selfDestruct() {
        this.manager.stop();

        try {
            fs.unlinkSync(BINARY_PATH);
        } catch (e) {
            // intentional
        }
    }

    async shutdown() {
        this.manager.stop();
    }
}

module.exports = LinuxDuststreamingCapability;

LinuxDuststreamingCapability.PLATFORM = Object.freeze({
    DREAME_MR813: "dreame_mr813",
    DREAME_MR536: "dreame_mr536",
    MIDEA_RK3566: "midea_rk3566",
});
