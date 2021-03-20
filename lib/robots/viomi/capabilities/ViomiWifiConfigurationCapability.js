const LinuxWifiConfigurationCapability = require("../../common/linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

class ViomiWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
    getWifiInterface() {
        return "wlan0";
    }

    /**
     * @returns {Promise<ValetudoWifiConfiguration>}
     */
    async getWifiConfiguration() {
        if (this.robot.config.get("embedded") === true) {
            return await super.getWifiConfiguration();
        }

        const output = {
            details: {
                state: ValetudoWifiConfiguration.STATE.UNKNOWN
            }
        };

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

        return new ValetudoWifiConfiguration(output);
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        throw new Error("Cannot set Wi-Fi configuration for Viomi vacuums");
    }
}

module.exports = ViomiWifiConfigurationCapability;
