const LinuxWifiConfigurationCapability = require("../linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");
const ValetudoWifiStatus = require("../../../entities/core/ValetudoWifiStatus");

/**
 * @extends LinuxWifiConfigurationCapability<import("../../MiioValetudoRobot")>
 */
class MiioWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
    /**
     * @returns {Promise<ValetudoWifiStatus>}
     */
    async getWifiStatus() {
        if (this.robot.config.get("embedded") === true) {
            return super.getWifiStatus();
        }

        const output = {
            state: ValetudoWifiStatus.STATE.UNKNOWN,
            details: {}
        };

        let res = await this.robot.sendCommand("miIO.info");

        if (typeof res === "object") {
            if (res.ap.bssid !== "") {
                output.state = ValetudoWifiStatus.STATE.CONNECTED;
                output.details.ips = [res.netif.localIp];
                output.details.ssid = res.ap.ssid;
                output.details.frequency = ValetudoWifiStatus.FREQUENCY_TYPE.W2_4Ghz;
                output.details.signal = res.ap.rssi;
            } else {
                output.state = ValetudoWifiStatus.STATE.NOT_CONNECTED;
            }
        }

        return new ValetudoWifiStatus(output);
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
            await this.robot.sendCommand(
                "miIO.config_router",
                {
                    "ssid": wifiConfig.ssid,
                    "passwd": wifiConfig.credentials.typeSpecificSettings.password,
                    "uid": 0,
                    "cc": "de",
                    "country_domain": "de",
                    "config_type": "app"
                },
                {
                    preferLocalInterface: true
                }
            );
        } else {
            throw new Error("Invalid wifiConfig");
        }
    }
}

module.exports = MiioWifiConfigurationCapability;
