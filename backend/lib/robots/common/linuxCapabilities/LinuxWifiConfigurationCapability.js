const NotImplementedError = require("../../../core/NotImplementedError");
const os = require("os");
const spawnSync = require("child_process").spawnSync;
const ValetudoWifiStatus = require("../../../entities/core/ValetudoWifiStatus");
const WifiConfigurationCapability = require("../../../core/capabilities/WifiConfigurationCapability");

/**
 * @template {import("../../../core/ValetudoRobot")} T
 * @extends WifiConfigurationCapability<T>
 */
class LinuxWifiConfigurationCapability extends WifiConfigurationCapability {
    /**
     * Implementations should provide or discover their own wireless interface, which will be used in
     * getWifiConfiguration().
     *
     * @abstract
     * @returns {string}
     */
    getWifiInterface() {
        throw new NotImplementedError();
    }

    /**
     * @returns {Promise<ValetudoWifiStatus>}
     */
    async getWifiStatus() {
        if (this.robot.config.get("embedded") !== true) {
            throw new NotImplementedError("Linux Wi-Fi configuration capability only works on the robot itself");
        }

        /*
            root@rockrobo:~# iw
            Usage:  iw [options] command
            Do NOT screenscrape this tool, we don't consider its output stable.

            :-)
         */
        const iwOutput = spawnSync("iw", ["dev", this.getWifiInterface(), "link"]).stdout.toString();
        const wifiStatus = this.parseIwStdout(iwOutput);

        if (wifiStatus.state === ValetudoWifiStatus.STATE.CONNECTED) {
            wifiStatus.details.ips = Object.values(os.networkInterfaces()).map(i => {
                return i.map(l => {
                    return l.address;
                });
            }).flat().sort().filter(ip => {
                return ip !== "127.0.0.1" && ip !== "::1";
            });
        }

        return wifiStatus;
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     * @abstract
     */
    async setWifiConfiguration(wifiConfig) {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {string} stdout
     * @return {ValetudoWifiStatus}
     */
    parseIwStdout(stdout) {
        const output = {
            state: ValetudoWifiStatus.STATE.UNKNOWN,
            details: {}
        };

        // eslint-disable-next-line regexp/no-super-linear-backtracking,regexp/optimal-quantifier-concatenation
        const WIFI_CONNECTED_IW_REGEX = /^Connected to (?<bssid>[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}).*(?:[\n\r\u2028\u2029]\s*)?SSID: (?<ssid>.*)\s*freq: (?<freq>\d*)\s*signal: (?<signal>-\d{1,3}) dBm\s*tx bitrate: (?<txbitrate>[\d.]*).*/;
        const WIFI_NOT_CONNECTED_IW_REGEX = /^Not connected\.$/;

        const extractedWifiData = stdout.match(WIFI_CONNECTED_IW_REGEX);
        if (extractedWifiData) {
            output.state = ValetudoWifiStatus.STATE.CONNECTED;
            output.details.upspeed = parseFloat(extractedWifiData.groups.txbitrate);
            output.details.signal = parseInt(extractedWifiData.groups.signal);
            output.details.ssid = extractedWifiData.groups.ssid.trim();
            output.details.frequency = ValetudoWifiStatus.FREQUENCY_TYPE.W2_4Ghz;
        } else if (stdout.trim().match(WIFI_NOT_CONNECTED_IW_REGEX)) {
            output.state = ValetudoWifiStatus.STATE.NOT_CONNECTED;
        }

        return new ValetudoWifiStatus(output);
    }
}

module.exports = LinuxWifiConfigurationCapability;
