const LinuxWifiConfigurationCapability = require("../linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

/**
 * @extends LinuxWifiConfigurationCapability<import("../../MiioValetudoRobot")>
 */
class MiioWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
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
                output.details.signal = res.ap.rssi;
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
        if (
            wifiConfig && wifiConfig.ssid && wifiConfig.credentials &&
            wifiConfig.credentials.type === ValetudoWifiConfiguration.CREDENTIALS_TYPE.WPA2_PSK &&
            wifiConfig.credentials.typeSpecificSettings && wifiConfig.credentials.typeSpecificSettings.password
        ) {
            //This command will only work when received on the local interface!
            await this.robot.sendLocal("miIO.config_router", {
                "ssid": wifiConfig.ssid,
                "passwd": wifiConfig.credentials.typeSpecificSettings.password,
                "uid": 0,
                "cc": "de",
                "country_domain": "de",
                "config_type": "app"
            }, {});
        } else {
            throw new Error("Invalid wifiConfig");
        }
    }

    getWifiInterface() {
        return "wlan0";
    }
}

module.exports = MiioWifiConfigurationCapability;
