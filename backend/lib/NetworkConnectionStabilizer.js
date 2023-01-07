const execFile = require("child_process").execFile;
const LinuxTools = require("./utils/LinuxTools");
const Logger = require("./Logger");

class NetworkConnectionStabilizer {
    /**
     * This ominously named class attempts to keep the Wi-Fi connection of the robot from breaking
     * by periodically pinging the default gateway
     * 
     * A few robots seem to have trouble with that. Likely because the vendors did not test non-cloud operation
     *
     * @param {object} options
     * @param {import("./Configuration")} options.config
     */
    constructor(options) {
        this.config = options.config;

        this.nextLoopTimeout = undefined;

        if (this.config.get("embedded") === true) {
            Logger.info("Starting NetworkConnectionStabilizer");

            this.scheduleLoop();
        }
    }

    /**
     * @private
     */
    scheduleLoop() {
        this.nextLoopTimeout = setTimeout(() => {
            this.loop().catch(() => {
                /* intentional */
            });
        }, INTERVAL);
    }

    /**
     * @private
     * @return {Promise<void>}
     */
    async loop() {
        const gatewayIp = LinuxTools.GET_GATEWAY_IP();

        if (gatewayIp) {
            try {
                await new Promise((resolve, reject) => {
                    execFile(
                        "ping",
                        ["-c", "1", gatewayIp],
                        (err, stdout, stderr) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(stdout);
                            }
                        }
                    );
                });
            } catch (e) {
                // intentional
            }
        }

        this.scheduleLoop();
    }

    /**
     * Shutdown NetworkConnectionStabilizer
     *
     * @public
     * @returns {Promise<void>}
     */
    async shutdown() {
        clearTimeout(this.nextLoopTimeout);
    }

}

const INTERVAL = 15 * 60 * 1000;

module.exports = NetworkConnectionStabilizer;
