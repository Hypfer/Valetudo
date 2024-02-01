const fs = require("fs");
const ntp = require("@destinationstransfers/ntp");

const execSync = require("child_process").execSync;

const Logger = require("./Logger");
const SetMCUTimeCapability = require("./core/capabilities/SetMCUTimeCapability");
const States = require("./entities/core/ntpClient");
const Tools = require("./utils/Tools");


class NTPClient {
    /**
     * @param {object} options
     * @param {import("./Configuration")} options.config
     * @param {import("./core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.nextPollTimeout = undefined;
        this.retryWaitTime = BASE_RETRY_WAIT_TIME;

        this.config.onUpdate((key) => {
            if (key === "ntpClient") {
                this.reconfigure();
            }
        });

        if (this.config.get("ntpClient").enabled) {
            this.state = new States.ValetudoNTPClientEnabledState({});
        } else {
            this.state = new States.ValetudoNTPClientDisabledState({});
        }
        this.busybox = fs.existsSync("/bin/busybox2") ? "/bin/busybox2" : "/bin/busybox";

        // On startup, we need to wait for a while for Valetudo to fully start up (at least when using pkg) or else
        // we will get ntp sync timeouts in the log due to something blocking the process for a while
        setTimeout(() => {
            this.reconfigure();
        }, 10000);
    }

    reconfigure() {
        clearTimeout(this.nextPollTimeout);
        this.retryWaitTime = BASE_RETRY_WAIT_TIME;
        const ntpConfig = this.config.get("ntpClient");

        if (ntpConfig.enabled === true) {
            this.state = new States.ValetudoNTPClientEnabledState({});

            if (this.config.get("embedded") === true || this.robot.hasCapability(SetMCUTimeCapability.TYPE)) {
                this.pollTime().catch(() => {
                    /* intentional */
                });
            }
        } else {
            this.state = new States.ValetudoNTPClientDisabledState({});
        }
    }

    /**
     * @private
     */
    async pollTime() {
        clearTimeout(this.nextPollTimeout);
        const ntpConfig = this.config.get("ntpClient");

        try {
            Logger.debug("Starting NTP Query for", {
                server: ntpConfig.server,
                port: ntpConfig.port,
                timeout: ntpConfig.timeout
            });
            const currentNTPTime = await ntp.getNetworkTime({
                server: ntpConfig.server,
                port: ntpConfig.port,
                timeout: ntpConfig.timeout
            });
            const preSyncTime = new Date();

            Logger.debug("Got Time from NTP Server:", currentNTPTime);

            await this.setTime(currentNTPTime);

            this.state = new States.ValetudoNTPClientSyncedState({
                offset: currentNTPTime.getTime() - preSyncTime.getTime()
            });
            this.retryWaitTime = BASE_RETRY_WAIT_TIME;

            Logger.debug(`Next NTP sync in ${ntpConfig.interval}ms`);

            this.nextPollTimeout = setTimeout(() => {
                this.pollTime().catch(() => {
                    /* intentional */
                });
            }, ntpConfig.interval);
        } catch (e) {
            let error = {
                type: States.ValetudoNTPClientErrorState.ERROR_TYPE.UNKNOWN,
                message: e.message
            };

            if (typeof e.code === "string") {
                switch (e.code) {
                    case "EAI_AGAIN":
                    case "ENETUNREACH":
                    case "ENETDOWN":
                    case "EAGAIN":
                    case "ECONNABORTED":
                    case "ECONNRESET":
                    case "EPIPE":
                        error.type = States.ValetudoNTPClientErrorState.ERROR_TYPE.TRANSIENT;
                        break;
                    case "ENOTFOUND":
                        error.type = States.ValetudoNTPClientErrorState.ERROR_TYPE.NAME_RESOLUTION;
                        break;
                }
            } else if (typeof e.message === "string" && e.message.indexOf("Timeout waiting") === 0) {
                error.type = States.ValetudoNTPClientErrorState.ERROR_TYPE.CONNECTION;
                error.message = e.message;
            } else if (e.stdout !== undefined) {
                error.type = States.ValetudoNTPClientErrorState.ERROR_TYPE.PERSISTING;
                error.message = e.stdout.toString() + " " + e.stderr.toString();
            }

            if (error.type !== States.ValetudoNTPClientErrorState.ERROR_TYPE.TRANSIENT) {
                Logger.warn(`${Tools.CAPITALIZE(error.type)} error during time sync: ${error.message}`);
            } else {
                Logger.debug(`${Tools.CAPITALIZE(error.type)} error during time sync: ${error.message}`);
            }

            this.state = new States.ValetudoNTPClientErrorState(error);

            Logger.debug(`Next NTP sync attempt in ${this.retryWaitTime}ms`);
            this.nextPollTimeout = setTimeout(() => {
                this.pollTime().catch(() => {
                    /* intentional */
                });
            }, this.retryWaitTime);

            this.retryWaitTime = Math.min(this.retryWaitTime * 2, 8 * 60 * 60 * 1000);
        }
    }


    async setTime(date) {
        if (this.config.get("embedded") === true) {
            let dateString = "";

            dateString += date.getFullYear().toString();
            dateString += "-";
            dateString += (date.getMonth() + 1).toString().padStart(2, 0);
            dateString += "-";
            dateString += date.getDate().toString().padStart(2, 0);
            dateString += " ";
            dateString += date.getHours().toString().padStart(2,0);
            dateString += ":";
            dateString += date.getMinutes().toString().padStart(2,0);
            dateString += ":";
            dateString += date.getSeconds().toString().padStart(2,0);


            execSync(this.busybox + " date -s \""+dateString+"\"");

            Logger.info("Successfully set the system time via NTP to", date);
        } else {
            Logger.warn("Cannot set the system time. We are not embedded.");
        }

        if (this.robot.hasCapability(SetMCUTimeCapability.TYPE)) {
            try {
                await this.robot.capabilities[SetMCUTimeCapability.TYPE].setTime(date);
                Logger.info("Successfully set the robot MCU time via NTP to", date);
            } catch (error) {
                Logger.info("Error while setting MCU time", error);
            }
        }

    }

    /**
     * Shutdown NTPClient
     *
     * @public
     * @returns {Promise<void>}
     */
    shutdown() {
        return new Promise((resolve, reject) => {
            Logger.debug("NTPClient shutdown in progress...");

            clearTimeout(this.nextPollTimeout);
            Logger.debug("NTPClient shutdown done");
            resolve();
        });
    }
}

const BASE_RETRY_WAIT_TIME = 60*1000; //1 Minute

module.exports = NTPClient;
