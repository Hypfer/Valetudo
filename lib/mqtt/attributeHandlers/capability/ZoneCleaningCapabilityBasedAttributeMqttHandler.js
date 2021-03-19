const CapabilityBasedAttributeMqttHandler = require("./CapabilityBasedAttributeMqttHandler");

class ZoneCleaningCapabilityBasedAttributeMqttHandler extends CapabilityBasedAttributeMqttHandler {
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
            topic: options.autoconfPrefix + "/sensor/" + options.identifier + "/ZoneCleaningCapability/config",
            payload: {
                availability_topic: options.availabilityTopic,
                device: options.deviceSpecification,
                name: "ValetudoZonePresets",
                state_topic: this.getStateTopic({
                    topicPrefix: options.topicPrefix,
                    identifier: options.identifier
                }),
                unique_id: options.identifier + "_ZoneCleaningCapability",
                icon: "mdi:square-outline",
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
        return options.topicPrefix + "/" + options.identifier + "/ZoneCleaningCapability/presets";
    }

    /**
     * @public
     * @abstract
     *
     * @returns {Promise<Array | boolean | object | number | string>}
     */
    async getPayload() {
        const presetsFromConfig = this.capability.robot.config.get("zonePresets") ?? {};

        return {
            state: Object.keys(presetsFromConfig).length,
            attributes: {
                presets: presetsFromConfig
            }
        };
    }
}

module.exports = ZoneCleaningCapabilityBasedAttributeMqttHandler;
