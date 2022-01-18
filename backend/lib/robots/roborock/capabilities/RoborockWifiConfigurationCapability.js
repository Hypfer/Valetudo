const MiioWifiConfigurationCapability = require("../../common/miioCapabilities/MiioWifiConfigurationCapability");
const ValetudoWifiStatus = require("../../../entities/core/ValetudoWifiStatus");

class RoborockWifiConfigurationCapability extends MiioWifiConfigurationCapability {
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

        let res = await this.robot.sendCommand("get_network_info");

        if (res !== "unknown_method") {
            if (typeof res === "object" && res.bssid !== "") {
                output.state = ValetudoWifiStatus.STATE.CONNECTED;

                output.details.signal = parseInt(res.rssi);
                output.details.ips = [res.ip];
                output.details.ssid = res.ssid;
                output.details.frequency = ValetudoWifiStatus.FREQUENCY_TYPE.W2_4Ghz;
            } else {
                output.details.state = ValetudoWifiStatus.STATE.NOT_CONNECTED;
            }
        }


        return new ValetudoWifiStatus(output);
    }
}

module.exports = RoborockWifiConfigurationCapability;
