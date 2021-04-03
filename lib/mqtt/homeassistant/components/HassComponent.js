const NotImplementedError = require("../../../core/NotImplementedError");
const CallbackHassAnchorSubscriber = require("../CallbackHassAnchorSubscriber");
const HassAnchor = require("../HassAnchor");

class HassComponent {
    /**
     * @param {object} options
     * @param {import("../HassController")} options.hass
     * @param {string} options.componentType
     * @param {string} options.componentId
     * @param {import("../../MqttController")} options.controller
     */
    constructor(options) {
        this.hass = options.hass;
        this.controller = options.controller;

        this.componentType = options.componentType;
        this.componentId = options.componentId;

        this.anchorSubscriber = new CallbackHassAnchorSubscriber(async () => {
            await this.refreshAutoconf();
        });
        this.topicRefSubscriber = new CallbackHassAnchorSubscriber(async () => {
            await this.refresh();
        });
    }

    getBaseTopic() {
        return this.hass.getBaseTopic() + "/" + this.componentType + "_" + this.componentId;
    }

    getAutoconfTopic() {
        return this.hass.getBaseAutoconfTopic() + "/" + this.componentType + "/" + this.hass.getDeviceId() + "/" + this.componentId + "/config";
    }

    /**
     * Ask the MQTT controller to refresh the Home Assistant autoconfig for this component.
     *
     * @return {Promise<void>}
     */
    async refreshAutoconf() {
        const resolved = HassAnchor.resolveTopicReferences(this.getAutoconf());
        if (resolved === null) {
            return;
        }
        // TODO
    }

    /**
     * Ask the MQTT controller to refresh the topics for this component.
     *
     * @return {Promise<void>}
     */
    async refresh() {
        const resolved = HassAnchor.resolveAnchors(this.getAutoconf());
        if (resolved === null) {
            return;
        }
        // TODO
    }

    /**
     * Must be implemented to return the Hass autoconf values. Keys are topic names and values are payloads.
     * Anchors are allowed.
     * Do not add the "device" boilerplate.
     *
     * @abstract
     * @return {object|null}
     */
    getAutoconf() {
        throw new NotImplementedError();
    }

    /**
     * Must be implemented to return the component values. Keys are topic names and values are payloads.
     * Anchors are allowed.
     * You may return null to signal that you are not ready
     *
     * @abstract
     * @return {object|null}
     */
    getTopics() {
        throw new NotImplementedError();
    }
}

module.exports = HassComponent;
