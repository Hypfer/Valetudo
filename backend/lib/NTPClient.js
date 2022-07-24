const ntp = require("@destinationstransfers/ntp");

const execSync = require("child_process").execSync;

const Logger = require("./Logger");
const States = require("./entities/core/ntpClient");
const Tools = require("./utils/Tools");


class NTPClient {
    /**
     * @param {object} options
     * @param {import("./Configuration")} options.config
     */
    constructor(options) {
        this.config = options.config;

        this.nextPollTimeout = undefined;

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

        // On startup, we need to wait for a while for Valetudo to fully start up (at least when using pkg) or else
        // we will get ntp sync timeouts in the log due to something blocking the process for a while
        setTimeout(() => {
            this.reconfigure();
        }, 10000);
    }

    reconfigure() {
        clearTimeout(this.nextPollTimeout);
        const ntpConfig = this.config.get("ntpClient");

        if (ntpConfig.enabled === true) {
            this.state = new States.ValetudoNTPClientEnabledState({});

            if (this.config.get("embedded") === true) {
                this.pollTime().then(() => {
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

            this.setTime(currentNTPTime);

            this.state = new States.ValetudoNTPClientSyncedState({
                offset: currentNTPTime.getTime() - preSyncTime.getTime()
            });

            Logger.debug("Next NTP sync in " + ntpConfig.interval + " ms");

            this.nextPollTimeout = setTimeout(() => {
                this.pollTime();
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

            Logger.debug("Next NTP sync in " + FAILURE_RETRY_INTERVAL + " ms");

            this.nextPollTimeout = setTimeout(() => {
                this.pollTime();
            }, FAILURE_RETRY_INTERVAL);
        }
    }


    setTime(date) {
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


            execSync("date -s \""+dateString+"\"");

            Logger.info("Successfully set the robot time via NTP to", date);
        } else {
            Logger.warn("Cannot set the time. We are not embedded.");
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

const FAILURE_RETRY_INTERVAL = 60*1000; //1 Minute

module.exports = NTPClient;
