const NotImplementedError = require("../../../core/NotImplementedError");
const CallbackHassAnchorSubscriber = require("../CallbackHassAnchorSubscriber");
const HassAnchor = require("../HassAnchor");

class HassComponent {
    /**
     * @param {object} options
     * @param {import("../HassController")} options.hass
     * @param {string} options.componentType
     * @param {string} options.componentId
     */
    constructor(options) {
        this.hass = options.hass;

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
     * @private
     * @param {string} type
     * @return {Array<HassAnchor>}
     */
    getAllAnchors(type) {
        let dto = {};
        switch (type) {
            case HassAnchor.TYPE.ANCHOR:
                dto = this.getTopics();
                break;
            case HassAnchor.TYPE.REFERENCE:
                dto = this.getAutoconf();
                break;
        }
        const anchors = [];
        const findAnchors = function (obj) {
            for (const value of Object.values(dto)) {
                if (value instanceof HassAnchor) {
                    anchors.push(value);
                } else if (value instanceof Object) {
                    findAnchors(value);
                }
            }
        };
        findAnchors(dto);
        return anchors;
    }

    /**
     * Configure this component
     *
     * @public
     * @return {Promise<void>}
     */
    async configure() {
        for (const anchor of this.getAllAnchors(HassAnchor.TYPE.REFERENCE)) {
            anchor.subscribe(this.topicRefSubscriber);
        }
        for (const anchor of this.getAllAnchors(HassAnchor.TYPE.ANCHOR)) {
            anchor.subscribe(this.anchorSubscriber);
        }
        await this.refreshAutoconf();
    }

    /**
     * Deconfigure this component
     *
     * @public
     * @return {Promise<void>}
     */
    async deconfigure() {
        for (const anchor of this.getAllAnchors(HassAnchor.TYPE.REFERENCE)) {
            anchor.unsubscribe(this.topicRefSubscriber);
        }
        for (const anchor of this.getAllAnchors(HassAnchor.TYPE.ANCHOR)) {
            anchor.unsubscribe(this.anchorSubscriber);
        }
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
     * Must be implemented to return the Hass autoconf payload.
     * Anchors are allowed, but they may only change while the component is not configured. This is not enforced.
     * Do not add the "device" boilerplate.
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
     * Must be implemented to return the component values. Keys are topic names and values are payloads.
     * Anchors are allowed, but they may only change while the component is not configured. This is not enforced.
     * You may return null to signal that you are not ready.
     *
     * @abstract
     * @protected
     * @return {object|null}
     */
    getTopics() {
        throw new NotImplementedError();
    }
}

module.exports = HassComponent;
