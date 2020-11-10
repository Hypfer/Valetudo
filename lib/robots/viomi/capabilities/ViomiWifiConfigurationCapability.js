const wireless = require("../../../utils/wireless");
const WifiConfigurationCapability = require("../../../core/capabilities/WifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

class ViomiWifiConfigurationCapability extends WifiConfigurationCapability {
    /**
     * @returns {Promise<ValetudoWifiConfiguration>}
     */
    async getWifiConfiguration() {
        const output = {
            details: {
                state: ValetudoWifiConfiguration.STATE.UNKNOWN
            }
        };

        if (this.robot.config.get("embedded") === true) {
            return wireless.getEmbeddedWirelessConfiguration("wlan0");
        } else {
            let res = await this.robot.sendCommand("miIO.info");

            if (typeof res === "object") {
                if (res.ap.bssid !== "") {
                    output.details.state = ValetudoWifiConfiguration.STATE.CONNECTED;
                    output.details.ips = [res.netif.localIp];
                    output.ssid = res.ap.ssid;
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
        throw new Error("Not implemented");
    }
}

module.exports = ViomiWifiConfigurationCapability;