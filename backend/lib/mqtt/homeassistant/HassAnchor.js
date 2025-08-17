/**
 * An HassAnchor represents a value that is not readily available during initialization, but that is expected to become
 * available at some point.
 * Such values can be values that Home Assistant expects to be inside a JSON but that is provided by handles as a raw
 * value, or references to topics which Home can retrieve values, but which are not known immediately.
 *
 * Handles should retrieve anchors they manage and post new values. Hass components will be notified and will get a
 * chance to publish an update for their value or their autoconfig JSON.
 *
 * @public
 */
class HassAnchor {
    /**
     * @package
     * @param {object} options
     * @param {string} options.type
     * @param {string} options.subType
     */
    constructor(options) {
        this.type = options.type;
        this.subType = options.subType;
        this.value = null;

        /** @type {Array<import("./HassAnchorSubscriber")>} */
        this.subscribers = [];
    }

    /**
     * @public
     * @return {string}
     */
    getType() {
        return this.type;
    }

    /**
     * @public
     * @return {string}
     */
    getSubType() {
        return this.subType;
    }

    /**
     * @public
     * @return {any}
     */
    getValue() {
        return this.value;
    }

    /**
     * Post a new value to this anchor and notify all subscribers.
     * If the value didn't change, no subscriber will be notified
     *
     * @public
     * @param {any} value
     */
    async post(value) {
        if (this.value !== value) {
            this.value = value;

            if (value !== null) {
                for (const subscriber of this.subscribers) {
                    await subscriber.onAnchorPost(this);
                }
            }
        }
    }

    /**
     * @param {import("./HassAnchorSubscriber")} subscriber
     */
    subscribe(subscriber) {
        if (!this.subscribers.includes(subscriber)) {
            this.subscribers.push(subscriber);
        }
    }

    /**
     * @param {import("./HassAnchorSubscriber")} subscriber
     */
    unsubscribe(subscriber) {
        const index = this.subscribers.indexOf(subscriber);

        if (index >= 0) {
            this.subscribers.splice(index, 1);
        }
    }
}


HassAnchor.TYPE = Object.freeze({
    ANCHOR: "anchor",
    REFERENCE: "topic reference"
});

HassAnchor.ANCHOR = Object.freeze({
    CONSUMABLE_VALUE: "consumable_value_",
    CURRENT_STATISTICS_TIME: "current_statistics_time",
    CURRENT_STATISTICS_AREA: "current_statistics_area",
    TOTAL_STATISTICS_TIME: "total_statistics_time",
    TOTAL_STATISTICS_AREA: "total_statistics_area",
    TOTAL_STATISTICS_COUNT: "total_statistics_count",
    FAN_SPEED: "fan_speed",
    MAP_SEGMENTS_LEN: "map_segments_len",
    ACTIVE_VALETUDO_EVENTS_COUNT: "active_valetudo_events_count",
    VACUUM_STATE: "vacuum_state",
    WIFI_IPS: "wifi_ips",
    WIFI_FREQUENCY: "wifi_freq",
    WIFI_SIGNAL: "wifi_signal",
    WIFI_SSID: "wifi_ssid"
});

HassAnchor.REFERENCE = Object.freeze({
    AVAILABILITY: "availability",
    BASIC_CONTROL_COMMAND: "basic_control_command",
    FAN_SPEED_SET: "fan_speed_set",
    FAN_SPEED_PRESETS: "fan_speed_presets", // Actually contains the presets, not a topic
    ERROR_STATE_DESCRIPTION: "error_state_description",
    VALETUDO_ROBOT_ERROR: "valetudo_robot_error",
    HASS_CONSUMABLE_STATE: "hass_consumable_state_",
    HASS_MAP_SEGMENTS_STATE: "hass_map_segments_state",
    HASS_ACTIVE_VALETUDO_EVENTS: "hass_active_valetudo_events",
    HASS_WIFI_CONFIG_ATTRS: "hass_wifi_config_attrs",
});

module.exports = HassAnchor;
