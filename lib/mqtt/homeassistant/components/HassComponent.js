const NotImplementedError = require("../../../core/NotImplementedError");
const CallbackHassAnchorSubscriber = require("../CallbackHassAnchorSubscriber");
const HassAnchor = require("../HassAnchor");
const Logger = require("../../../Logger");
const {HomieCommonAttributes} = require("../../homie");

class HassComponent {
    /**
     * @param {object} options
     * @param {import("../HassController")} options.hass
     * @param {import("../../../core/ValetudoRobot")} options.robot
     * @param {string} options.componentType
     * @param {string} options.componentId
     */
    constructor(options) {
        this.hass = options.hass;
        this.robot = options.robot;

        this.componentType = options.componentType;
        this.componentId = options.componentId;

        this.topicRefSubscriber = new CallbackHassAnchorSubscriber(async () => {
            await this.refreshAutoconf();
        });
        this.anchorSubscriber = new CallbackHassAnchorSubscriber(async () => {
            await this.refresh();
        });
    }

    /**
     * @public
     * @return {string}
     */
    getBaseTopic() {
        return this.hass.getBaseTopic() + "/" + this.componentId;
    }

    /**
     * @public
     * @return {string}
     */
    getAutoconfTopic() {
        return this.hass.getBaseAutoconfTopic() + "/" + this.componentType + "/" + this.hass.identifier + "/" + this.componentId + "/config";
    }

    /**
     * @private
     * @param {object|null} json
     * @return {Array<HassAnchor>}
     */
    getAllAnchors(json) {
        const anchors = [];
        if (json === null) {
            return anchors;
        }
        const findAnchors = function (obj) {
            for (const value of Object.values(obj)) {
                if (value instanceof HassAnchor) {
                    anchors.push(value);
                } else if (value instanceof Object) {
                    findAnchors(value);
                }
            }
        };
        findAnchors(json);
        return anchors;
    }

    /**
     * Configure this component
     *
     * @public
     * @return {Promise<void>}
     */
    async configure() {
        for (const anchor of this.getAllAnchors(this.getAutoconf())) {
            anchor.subscribe(this.topicRefSubscriber);
        }
        for (const anchor of this.getAllAnchors(this.getTopics())) {
            anchor.subscribe(this.anchorSubscriber);
        }
        await this.refreshAutoconf();
        await this.refresh();
    }

    /**
     * Deconfigure this component
     *
     * @public
     * @param {import("../../MqttController").DeconfigureOptions} [options]
     * @return {Promise<void>}
     */
    async deconfigure(options) {
        for (const anchor of this.getAllAnchors(this.getAutoconf())) {
            anchor.unsubscribe(this.topicRefSubscriber);
        }
        for (const anchor of this.getAllAnchors(this.getTopics())) {
            anchor.unsubscribe(this.anchorSubscriber);
        }
        if (options.cleanHass) {
            await this.hass.dropAutoconf(this);
        }
    }

    /**
     * Helper function for debugging incorrect anchor usage during development. Enable with debug.debugHassAnchors
     *
     * @private
     * @param {string} what What was being done by whowever called this function
     * @param {object} json Object with unresolved anchors
     */
    debugAnchors(what, json) {
        if (!this.hass.debugAnchors) {
            return;
        }
        Logger.debug("Failed " + what + " for Hass component of type " + this.componentType + " and id " +
            this.componentId + " due to the following unresolved anchors");
        for (const anchor of this.getAllAnchors(json)) {
            if (anchor.getValue() === null) {
                Logger.debug(" - type " + anchor.getType() + " subtype " + anchor.getSubType());
            }
        }
        try {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("See stack trace");
        } catch (err) {
            Logger.debug(err);
        }
    }

    /**
     * Ask the MQTT controller to refresh the Home Assistant autoconfig for this component.
     *
     * @return {Promise<void>}
     */
    async refreshAutoconf() {
        const resolved = HassAnchor.resolveTopicReferences(this.getAutoconfInternal());
        if (resolved === null) {
            this.debugAnchors("autoconf", this.getAutoconf());
            return;
        }
        await this.hass.refreshAutoconf(this, resolved);
    }

    /**
     * Ask the MQTT controller to refresh the topics for this component.
     *
     * @public
     * @return {Promise<void>}
     */
    async refresh() {
        const resolved = HassAnchor.resolveAnchors(this.getTopics());
        if (resolved === null) {
            this.debugAnchors("refresh", this.getTopics());
            return;
        }
        await this.hass.refresh(this, resolved);
    }

    /**
     * Must be implemented to return the Hass autoconf payload.
     * Anchors are allowed, but they may only change while the component is not configured. This is not enforced.
     * Do not add the "device" boilerplate or availability topic stuff, they will be overwritten.
     * You may NOT return null.
     *
     * @abstract
     * @protected
     * @return {object}
     */
    getAutoconf() {
        throw new NotImplementedError();
    }

    /**
     * @private
     * @return {object}
     */
    getAutoconfInternal() {
        return Object.assign(this.getAutoconf(), {
            unique_id: this.componentId,
            availability_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.AVAILABILITY),
            payload_available: HomieCommonAttributes.STATE.READY,
            // MqttController will try to send "lost" at least once before cleanly disconnecting
            payload_not_available: HomieCommonAttributes.STATE.LOST,
            availability_mode: "latest",
            device: this.hass.getAutoconfDeviceBoilerplate(),
        });
    }

    /**
     * Must be implemented to return the component values. Keys are topic names and values are payloads.
     * Anchors are allowed, but they may only change while the component is not configured. This is not enforced.
     * You may return null to signal that you are not ready.
     *
     * @protected
     * @return {object|null}
     */
    getTopics() {
        return null;
    }
}

module.exports = HassComponent;
