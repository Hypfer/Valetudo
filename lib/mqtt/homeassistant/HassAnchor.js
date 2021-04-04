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
     *
     * @public
     * @param {any} value
     */
    async post(value) {
        this.value = value;
        if (value !== null) {
            for (const subscriber of this.subscribers) {
                await subscriber.onAnchorPost(this);
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

/** @private */
HassAnchor._anchors = {};

/** @private */
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
    if (!Object.values(HassAnchor.ANCHOR).includes(anchor)) {
        throw new Error("Invalid anchor: " + anchor);
    }
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
    if (!Object.values(HassAnchor.REFERENCE).includes(reference)) {
        throw new Error("Invalid topic reference: " + reference);
    }
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
        } else if (val instanceof Object) {
            const nested = HassAnchor.resolve(val);
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
    FAN_SPEED: "fan_speed",
    FAN_SPEED_PRESETS: "fan_speed_presets",
    VACUUM_STATE: "vacuum_state",
});

HassAnchor.REFERENCE = Object.freeze({
    AVAILABILITY: "availability",
    HANDLE_SET_FAN_SPEED: "handle_set_fan_speed",
    HASS_CUSTOM_COMMAND: "hass_custom_command",
    HASS_MAP_DATA: "hass_map_data",
    HASS_ROBOT_COMMAND: "hass_robot_command",
    HASS_VACUUM_STATE: "hass_vacuum_state",
    HASS_WIFI_STATE: "hass_wifi_state",
});

module.exports = HassAnchor;
