const ntp = require("@destinationstransfers/ntp");

const execSync = require("child_process").execSync;

const Logger = require("./Logger");


class NTPClient {
    /**
     * @param {object} options
     * @param {import("./Configuration")} options.config
     */

    constructor(options) {
        this.config = options.config;

        this.nextPollTimeout = undefined;

        if (this.config.get("embedded") === true) {
            this.pollTime().then(() => {});
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

            Logger.debug("Got Time from NTP Server:", currentNTPTime);

            this.setTime(currentNTPTime);

            Logger.debug("Next NTP sync in " + ntpConfig.interval + " ms");

            this.nextPollTimeout = setTimeout(() => {
                this.pollTime();
            }, ntpConfig.interval);
        } catch (e) {
            Logger.warn("Error during time sync:", e);

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
