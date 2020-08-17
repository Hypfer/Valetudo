const spawnSync = require("child_process").spawnSync;
const os = require("os");
const WifiConfigurationCapability = require("../../../core/capabilities/WifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

class RoborockWifiConfigurationCapability extends WifiConfigurationCapability {
    /**
     * @returns {Promise<import("../../../entities/core/ValetudoWifiConfiguration")>}
     */
    async getWifiConfiguration() {
        const output = {
            details: {
                state: ValetudoWifiConfiguration.STATE.UNKNOWN
            }
        };

        if (this.robot.config.get("embedded") === true) {
            /*
                root@rockrobo:~# iw
                Usage:  iw [options] command
                Do NOT screenscrape this tool, we don't consider its output stable.

                :-)
             */
            const iwOutput = spawnSync("iw", ["dev", "wlan0", "link"]).stdout;

            if (iwOutput) {
                const WIFI_CONNECTED_IW_REGEX = /^Connected to (?<bssid>[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (?<ssid>.*)\s*freq: (?<freq>[0-9]*)\s*signal: (?<signal>-[0-9]{1,3}) dBm\s*tx bitrate: (?<txbitrate>[0-9.]*).*/;

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
        } else {
            let res = await this.robot.sendCommand("get_network_info");

            if (res !== "unknown_method") {
                if (typeof res === "object" && res.bssid !== "") {
                    output.details.state = ValetudoWifiConfiguration.STATE.CONNECTED;

                    output.details.signal = parseInt(res.rssi);
                    output.details.ips = [res.ip];
                    output.ssid = res.ssid;
                    output.details.frequency = ValetudoWifiConfiguration.FREQUENCY_TYPE.W2_4Ghz;
                } else {
                    output.details.state = ValetudoWifiConfiguration.STATE.NOT_CONNECTED;
                }
            }
        }

        return new ValetudoWifiConfiguration(output);
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        if (
            wifiConfig && wifiConfig.ssid && wifiConfig.credentials &&
            wifiConfig.credentials.type === ValetudoWifiConfiguration.CREDENTIALS_TYPE.WPA2_PSK &&
            wifiConfig.credentials.typeSpecificSettings && wifiConfig.credentials.typeSpecificSettings.password
        ) {
            await this.robot.sendCommand("miIO.config_router", {
                "ssid": wifiConfig.ssid,
                "passwd": wifiConfig.credentials.typeSpecificSettings.password,
                "uid": 0
            }, {});
        } else {
            throw new Error("Invalid wifiConfig");
        }
    }
}

module.exports = RoborockWifiConfigurationCapability;