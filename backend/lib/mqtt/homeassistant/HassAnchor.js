/**
 * An HassAnchor represents a value that is not readily available during initialization, but that is expected to become
 * available at some point.
 * Such values can be values that Home Assistant expects to be inside a JSON but that is provided by handles  as a raw
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

/** @module */
HassAnchor._anchors = {};

/** @module */
HassAnchor._references = {};

/**
 * Retrieve an instance for an anchor.
 *
 * @public
 * @static
 * @param {string} anchor
 * @return {HassAnchor}
 */
HassAnchor.getAnchor = function (anchor) {
    if (HassAnchor._anchors[anchor] === undefined) {
        HassAnchor._anchors[anchor] = new HassAnchor({type: HassAnchor.TYPE.ANCHOR, subType: anchor});
    }

    return HassAnchor._anchors[anchor];
};


/**
 * Retrieve an instance for a topic reference
 *
 * @public
 * @static
 * @param {string} reference
 * @return {HassAnchor}
 */
HassAnchor.getTopicReference = function (reference) {
    if (HassAnchor._references[reference] === undefined) {
        HassAnchor._references[reference] = new HassAnchor({type: HassAnchor.TYPE.REFERENCE, subType: reference});
    }

    return HassAnchor._references[reference];
};

/**
 * @private
 * @static
 * @param {string} anchorType
 * @param {object} json
 * @return {object|null}
 */
const resolve = function (anchorType, json) {
    if (json === null) {
        return null;
    }

    const result = {};

    for (const [key, val] of Object.entries(json)) {
        if (val instanceof HassAnchor) {
            if (val.getType() !== anchorType) {
                throw new Error("Wrong anchor type! Expecting " + anchorType + ", found " + val.getType());
            }

            const anchorVal = val.getValue();
            if (anchorVal === null) {
                return null;
            }

            result[key] = anchorVal;

        } else if (!(val instanceof Array) && val instanceof Object) {
            const nested = resolve(anchorType, val);
            if (nested === null) {
                return null;
            }

            result[key] = nested;
        } else {
            result[key] = val;
        }
    }

    return result;
};

/**
 * Resolve anchors in provided JSON object. If one or more anchors cannot be resolved, returns null.
 * If all anchors are resolved, returns the JSON object with all anchors replaced with their respective values.
 *
 * @public
 * @static
 * @param {object} json
 * @return {object|null}
 */
HassAnchor.resolveAnchors = function (json) {
    return resolve(HassAnchor.TYPE.ANCHOR, json);
};

/**
 * Resolve topic references in provided JSON object. If one or more references cannot be resolved, returns null.
 * If all references are resolved, returns the JSON object with all references replaced with their respective values.
 *
 * @public
 * @static
 * @param {object} json
 * @return {object|null}
 */
HassAnchor.resolveTopicReferences = function (json) {
    return resolve(HassAnchor.TYPE.REFERENCE, json);
};


HassAnchor.TYPE = Object.freeze({
    ANCHOR: "anchor",
    REFERENCE: "topic reference"
});

HassAnchor.ANCHOR = Object.freeze({
    BATTERY_LEVEL: "battery_level",
    BATTERY_CHARGING: "battery_charging",
    CONSUMABLE_VALUE: "consumable_value_",
    CURRENT_STATISTICS_TIME: "current_statistics_time",
    CURRENT_STATISTICS_AREA: "current_statistics_area",
    FAN_SPEED: "fan_speed",
    MAP_SEGMENTS_LEN: "map_segments_len",
    VACUUM_STATE: "vacuum_state",
    WIFI_IPS: "wifi_ips",
    WIFI_FREQUENCY: "wifi_freq",
    WIFI_SIGNAL: "wifi_signal",
    WIFI_SSID: "wifi_ssid",
});

HassAnchor.REFERENCE = Object.freeze({
    AVAILABILITY: "availability",
    BASIC_CONTROL_COMMAND: "basic_control_command",
    FAN_SPEED_SET: "fan_speed_set",
    FAN_SPEED_PRESETS: "fan_speed_presets", // Actually contains the presets, not a topic
    HASS_CONSUMABLE_STATE: "hass_consumable_state_",
    HASS_MAP_SEGMENTS_STATE: "hass_map_segments_state",
    HASS_WATER_GRADE_PRESETS: "hass_water_grade_presets",
    HASS_WIFI_CONFIG_ATTRS: "hass_wifi_config_attrs",
});

module.exports = HassAnchor;
