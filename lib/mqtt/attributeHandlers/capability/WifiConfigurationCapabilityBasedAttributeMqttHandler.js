const CapabilityBasedAttributeMqttHandler = require("./CapabilityBasedAttributeMqttHandler");

class WifiConfigurationCapabilityBasedAttributeMqttHandler extends CapabilityBasedAttributeMqttHandler {
    /**
     * @public
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.autoconfPrefix
     * @param {string} options.identifier
     * @param {object} options.deviceSpecification
     * @param {string} options.availabilityTopic There's only one because there can only be one LWT
     */
    getAutoConfData(options) {
        return {
            topic: options.autoconfPrefix + "/sensor/" + options.identifier + "/WifiConfigurationCapability/config",
            payload: { //TODO: expire_after? //TODO:  force_update ?
                availability_topic: options.availabilityTopic,
                device: options.deviceSpecification,
                name: "Wifi",
                state_topic: this.getStateTopic({
                    topicPrefix: options.topicPrefix,
                    identifier: options.identifier
                }),
                unique_id: options.identifier + "_WifiConfigurationCapability",
                unit_of_measurement: "dBm",
                icon: "mdi:wifi",
                value_template: "{{value_json.state}}",
                json_attributes_topic: this.getStateTopic({
                    topicPrefix: options.topicPrefix,
                    identifier: options.identifier
                }),
                json_attributes_template: "{{value_json.attributes | to_json}}"
            }
        };
    }

    /**
     * @public
     *
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.identifier
     */
    getStateTopic(options) {
        return options.topicPrefix + "/" + options.identifier + "/WifiConfigurationCapability/state";
    }

    /**
     * @public
     * @abstract
     *
     * @returns {Promise<Array | boolean | object | number | string>}
     */
    async getPayload() {
        const wifiConfig = await this.capability.getWifiConfiguration();

        return {
            state: wifiConfig.details.signal,
            attributes: {
                ssid: wifiConfig.ssid,
                downspeed: wifiConfig.details.downspeed,
                upspeed: wifiConfig.details.upspeed,
                ips: wifiConfig.details.ips,
                frequency: wifiConfig.details.frequency
            }
        };
    }
}

module.exports = WifiConfigurationCapabilityBasedAttributeMqttHandler;
