const NotImplementedError = require("../../../core/NotImplementedError");
const os = require("os");
const spawnSync = require("child_process").spawnSync;
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");
const WifiConfigurationCapability = require("../../../core/capabilities/WifiConfigurationCapability");

/**
 * @template {import("../../../core/ValetudoRobot")} T
 * @extends WifiConfigurationCapability<T>
 */
class LinuxWifiConfigurationCapability extends WifiConfigurationCapability {
    /**
     * Implementations should provide or discover their own wireless interface which will be used in
     * getWifiConfiguration().
     *
     * @abstract
     * @returns {string}
     */
    getWifiInterface() {
        throw new NotImplementedError();
    }

    /**
     * @returns {Promise<ValetudoWifiConfiguration>}
     */
    async getWifiConfiguration() {
        if (this.robot.config.get("embedded") !== true) {
            throw new NotImplementedError("Linux Wi-Fi configuration capability only works on the robot itself");
        }

        const output = {
            details: {
                state: ValetudoWifiConfiguration.STATE.UNKNOWN
            }
        };

        /*
            root@rockrobo:~# iw
            Usage:  iw [options] command
            Do NOT screenscrape this tool, we don't consider its output stable.

            :-)
         */
        const iwOutput = spawnSync("iw", ["dev", this.getWifiInterface(), "link"]).stdout;

        if (iwOutput) {
            const WIFI_CONNECTED_IW_REGEX = /^Connected to (?<bssid>[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2})(?:.*\s*)SSID: (?<ssid>.*)\s*freq: (?<freq>\d*)\s*signal: (?<signal>-\d{1,3}) dBm\s*tx bitrate: (?<txbitrate>[\d.]*).*/;

            const extractedWifiData = iwOutput.toString().match(WIFI_CONNECTED_IW_REGEX);
            if (extractedWifiData) {
                output.details.state = ValetudoWifiConfiguration.STATE.CONNECTED;
                output.details.upspeed = parseFloat(extractedWifiData.groups.txbitrate);
                output.details.signal = parseInt(extractedWifiData.groups.signal);
                output.ssid = extractedWifiData.groups.ssid.trim();
                output.details.ips = Object.values(os.networkInterfaces()).map(i => i.map(l => l.address)).flat().sort().filter(ip => ip !== "127.0.0.1" && ip !== "::1"); //lol this line
                output.details.frequency = ValetudoWifiConfiguration.FREQUENCY_TYPE.W2_4Ghz;
            }
        } else {
            output.details.state = ValetudoWifiConfiguration.STATE.NOT_CONNECTED;
        }

        const ipOutput = spawnSync("ip", ["address", "show", "dev", this.getWifiInterface()]).stdout;
        if (ipOutput) {
            const lines = ipOutput.split("\n");
            const ether = lines[1];
            if (ether !== undefined) {
                const mac = ether.trim().split(" ")[1];
                if (mac !== undefined && mac.includes(":")) {
                    output.details.mac = mac;
                }
            }
        }

        return new ValetudoWifiConfiguration(output);
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     * @abstract
     */
    async setWifiConfiguration(wifiConfig) {
        throw new NotImplementedError();
    }
}

module.exports = LinuxWifiConfigurationCapability;
