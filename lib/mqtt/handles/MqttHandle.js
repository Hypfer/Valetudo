const DataType = require("../homie/DataType");
const iso8601 = require("../../utils/iso8601");
const NotImplementedError = require("../../core/NotImplementedError");

/**
 * This abstract class represents a handle to an arbitrary level of the Homie MQTT hierarchy.
 * Children must be able to provide Homie attributes and a base topic.
 *
 * @abstract
 */
class MqttHandle {
    /**
     * @param {object} options
     * @param {string} options.topicName
     * @param {string} options.friendlyName
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {boolean} [options.gettable] Whether this handle's root topic can be published, Default false
     * @param {boolean} [options.settable] Whether this handle's /set topic should be subscribed to. Default false
     * @param {string} [options.datatype] Data type for this handle, if gettable/settable
     * @param {string} [options.format] Restrictions or options based on the given datatype
     * @param {boolean} [options.retained] Whether to retain this property, default true
     * @param {MqttHandle} [options.parent]
     */
    constructor(options) {
        this.parent = options.parent === undefined ? null : options.parent;
        this.controller = options.controller;
        this.topicName = options.topicName;
        this.friendlyName = options.friendlyName;
        this.dataType = options.datatype;
        this.format = options.format;

        this.retained = options.retained === undefined ? true : options.retained;
        this.gettable = options.gettable === undefined ? false : options.gettable;
        this.settable = options.settable === undefined ? false : options.settable;
        this.isCommand = !this.gettable && this.settable;

        this.lastSetValue = null;
        this.configured = false;

        /** @type {Array<MqttHandle>} */
        this.children = [];
    }

    /**
     * Return the base topic for this handle. The root handle must implement this method.
     *
     * @public
     * @return {string}
     */
    getBaseTopic() {
        if (this.parent !== null) {
            return this.parent.getBaseTopic() + "/" + this.topicName;
        }
        throw new NotImplementedError();
    }

    /**
     * Return topics that this handle is interested in. This contains by default the /set topic if this handle is
     * settable. If more topics are desired, it can be overridden and extended.
     *
     * @public
     * @return {object}
     */
    getInterestingTopics() {
        let topics = {};
        if (this.settable) {
            topics[this.getBaseTopic() + "/set"] = this.setHomie;
        }
        return topics;
    }

    /**
     * Register a new child. All handles will have this implemented, but actual usage will have to conform to the
     * specifications.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @package
     * @param {MqttHandle} child
     * @return {void}
     */
    registerChild(child) {
        if (this.controller.isInitialized()) {
            throw new Error("New children may only be registered while the MQTT controller is not initialized");
        }
        this.children.push(child);
    }

    /**
     * Deregister child.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @package
     * @param {MqttHandle} child
     * @return {void}
     */
    deregisterChild(child) {
        if (this.controller.isInitialized()) {
            throw new Error("Children may only be deregistered while the MQTT controller is not initialized");
        }
        const idx = this.children.indexOf(child);
        if (idx >= 0) {
            this.children.splice(idx, 1);
        }
    }

    /**
     * Returns Homie attributes for the current handle.
     *
     * @public
     * @abstract
     * @return {object}
     */
    getHomieAttributes() {
        throw new NotImplementedError();
    }

    /**
     * Configure this handle. It will re-publish all autodiscovery-related attributes.
     * It will also configure all children handles.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @public
     * @return {Promise<void>}
     */
    async configure() {
        if (this.controller.isInitialized()) {
            throw new Error("Handle may only be configured while the MQTT controller is not initialized");
        }
        await this.controller.publishHomieAttributes(this);
        await this.controller.subscribe(this);

        for (const child of this.children) {
            await child.configure();
        }
    }

    /**
     * Deconfigure this handle. It will publish zero-length payloads to all autodiscovery-related attributes.
     * It will also deconfigure all children handles.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @public
     * @return {Promise<void>}
     */
    async deconfigure() {
        if (this.controller.isInitialized()) {
            throw new Error("Handle may only be deconfigured while the MQTT controller is not initialized");
        }
        await this.controller.unsubscribe(this);

        for (const child of this.children) {
            await child.deconfigure();
        }

        await this.controller.dropHandleValue(this);
        await this.controller.dropHomieAttributes(this);
    }

    /**
     * Recursively re-publish all any values from this handle and all children.
     *
     * @public
     * @return {Promise<void>}
     */
    async refresh() {
        await this.controller.refresh(this);
        for (const child of this.children) {
            await child.refresh();
        }
    }

    /**
     * This method should be implemented if the handle is gettable, and it should return a raw JavaScript value to be
     * published, conforming to the provided datatype
     *
     * @public
     * @return {Promise<*>}
     */
    async get() {
        if (this.gettable) {
            throw new NotImplementedError("Please implement a getter for " + this.getBaseTopic());
        }
    }

    /**
     * This method should be implemented if the handle is settable, and it should accept a raw JavaScript value received
     * from the MQTT set topic, which will conform to the provided data type.
     *
     * @public
     * @param {*} value
     */
    async set(value) {
        if (this.settable) {
            throw new NotImplementedError("Please implement a setter for " + this.getBaseTopic());
        }
    }

    /**
     * Used by MqttController to retrieve the value of this property to be published for Homie
     *
     * @public
     * @return {Promise<string|null>}
     */
    async getHomie() {
        if (this.isCommand) {
            if (this.lastSetValue === null || this.lastSetValue === undefined) {
                return null;
            }
            return this.marshalHomie(this.lastSetValue);
        } else {
            return this.marshalHomie(await this.get());
        }
    }

    /**
     * Used by MqttController to hand over a value set over MQTT
     *
     * @public
     * @param {string} value
     * @return {Promise<void>}
     */
    async setHomie(value) {
        if (!this.settable) {
            return;
        }
        const converted = this.unmarshalHomie(value);
        await this.set(converted);
        if (this.isCommand) {
            this.lastSetValue = converted;
            await this.refresh();
        }
    }

    /**
     * Converts a JS value to a Homie-compatible value, based on the provided data type
     *
     * @protected
     * @param {*} value
     * @return {string|null}
     */
    marshalHomie(value) {
        if (value === null || value === undefined) {
            return null;
        }
        switch (this.dataType) {
            case DataType.STRING:
            case DataType.ENUM:
            case DataType.COLOR:
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }
                if (typeof value !== "string") {
                    throw new Error("Value must be a string!");
                }
                if (this.dataType === DataType.ENUM && this.format.split(",").indexOf(value) < 0) {
                    throw new Error("Value '" + value + "' is invalid for enum!");
                }
                return value;
            case DataType.INTEGER:
                return Math.round(value).toString();
            case DataType.FLOAT:
                return value.toString();
            case DataType.DATETIME:
                if (value.prototype.toISOString === undefined) {
                    throw new Error("Date value must be a Date object!");
                }
                return value.prototype.toISOString();
            case DataType.DURATION:
                return iso8601.numberToDuration(value);
            case DataType.BOOLEAN:
                return value ? "true" : "false";
            default:
                return JSON.stringify(value);
        }
    }

    /**
     * Convert a Homie-compatible value to a JS value, based on the current data type
     *
     * @protected
     * @param {string|null} value
     * @return {*}
     */
    unmarshalHomie(value) {
        if (value === null || value === undefined) {
            return null;
        }
        switch (this.dataType) {
            case DataType.INTEGER:
                return parseInt(value, 10);
            case DataType.FLOAT:
                return parseFloat(value);
            case DataType.DATETIME:
                return new Date(value);
            case DataType.BOOLEAN:
                return value === "true";
            case DataType.DURATION:
                return iso8601.durationToNumber(value);
            default:
                return value;
        }
    }
}

module.exports = MqttHandle;
