const DataType = require("../homie/DataType");
const iso8601 = require("../../utils/iso8601");
const Logger = require("../../Logger");
const MqttCommonAttributes = require("../MqttCommonAttributes");
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
     * @param {DataType} [options.datatype] Data type for this handle, if gettable/settable
     * @param {string} [options.format] Restrictions or options based on the given datatype
     * @param {boolean} [options.retained] Whether to retain this property, default true
     * @param {string} [options.helpText] Optional help message to be included in the documentation
     * @param {object} [options.helpMayChange] Optional object of what:dueTo pairs explaining stuff that may have a
     * different format, unit, children properties and that should be scanned dynamically, to be included in the docs.
     * @param {MqttHandle} [options.parent]
     */
    constructor(options) {
        this.parent = options.parent === undefined ? null : options.parent;
        this.controller = options.controller;
        this.topicName = options.topicName;
        this.friendlyName = options.friendlyName;
        this.dataType = options.datatype;
        this.format = options.format;
        this.helpText = options.helpText;
        this.helpMayChange = options.helpMayChange;

        this.gettable = options.gettable === undefined ? false : options.gettable;
        this.settable = options.settable === undefined ? false : options.settable;
        this.isCommand = !this.gettable && this.settable;

        this.retained = options.retained ?? !this.isCommand;

        this.lastSetValue = null;
        this.configured = false;

        if (this.controller === undefined) {
            throw new Error("Initialized MQTT handle without controller");
        }

        /** @type {Array<MqttHandle>} */
        this.children = [];

        /** @type {Array<import("../homeassistant/components/HassComponent")>} */
        this.hassComponents = [];
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
        } else {
            throw new NotImplementedError();
        }
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
            topics[this.getBaseTopic() + "/set"] = async (value) => {
                try {
                    await this.setHomie(value);
                } catch (err) {
                    Logger.error("MQTT: Error while handling " + this.getBaseTopic() + "/set", {
                        payload: value,
                        error: err
                    });
                }
            };
        }

        return topics;
    }

    /**
     * Register a new child. All handles will have this implemented, but actual usage will have to conform to the
     * specifications.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @protected
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
     * @protected
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
     * Attach a Home Assistant component to this handle. Call this from inside the controller's withHass method to get
     * the HassController reference required to create components.
     * This method may be called at any point in time, but the component won't work properly until this handle is
     * reconfigured.
     * Components should preferrably be attached from the constructor.
     *
     * @public
     * @param {import("../homeassistant/components/HassComponent")} component
     */
    attachHomeAssistantComponent(component) {
        this.hassComponents.push(component);
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
            try {
                await child.configure();
            } catch (e) {
                Logger.warn("MQTT handle " + child.getBaseTopic() + " failed to configure", e);
            }
        }

        for (const component of this.hassComponents) {
            try {
                await component.configure();
            } catch (e) {
                Logger.warn("Hass component " + component.getAutoconfTopic() + " failed to configure", e);
            }
        }
    }

    /**
     * Deconfigure this handle. It will publish zero-length payloads to all autodiscovery-related attributes.
     * It will also deconfigure all children handles.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @public
     * @param {import("../MqttController").DeconfigureOptions} [options]
     * @return {Promise<void>}
     */
    async deconfigure(options) {
        if (this.controller.isInitialized()) {
            throw new Error("Handle may only be deconfigured while the MQTT controller is not initialized");
        }

        if (options === undefined || options.unsubscribe !== false) {
            await this.controller.unsubscribe(this);
        }

        for (const component of this.hassComponents) {
            await component.deconfigure(Object.assign({
                cleanHass: false,
            }, options));
        }

        for (const child of this.children) {
            await child.deconfigure(options);
        }

        if (options === undefined || options.cleanHomie !== false) {
            await this.controller.dropHomieAttributes(this);
        }
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

        for (const component of this.hassComponents) {
            await component.refresh();
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
     * @public
     * @returns {number}
     */
    getQoS() {
        // Reasonable default for most things published to mqtt
        return MqttCommonAttributes.QOS.AT_LEAST_ONCE;
    }

    /**
     * Used by MqttController to retrieve the value of this property to be published for Homie
     *
     * @public
     * @return {Promise<string|Buffer|null>}
     */
    async getHomie() {
        try {
            if (this.isCommand) {
                if (this.lastSetValue === null || this.lastSetValue === undefined) {
                    return null;
                }

                return this.marshalHomie(this.lastSetValue, this.dataType);
            } else {
                return this.marshalHomie(await this.get(), this.dataType);
            }

        } catch (err) {
            Logger.warn("Failed to parse value to be sent for topic " + this.getBaseTopic() + ":", err);
            return null;
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

        let converted = null;

        try {
            converted = this.unmarshalHomie(value, this.dataType);
        } catch (err) {
            Logger.warn("Failed to parse received value, topic " + this.getBaseTopic() + "/set, value: '" + value + "':", err);
            return;
        }


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
     * @param {string} datatype
     * @return {string|Buffer|null}
     */
    marshalHomie(value, datatype) {
        if (value === null || value === undefined) {
            return null;
        }

        if (value instanceof Buffer) {
            if (datatype !== DataType.STRING) {
                throw new Error("Outbound Buffer is only allowed for data of type STRING");
            } else {
                return value;
            }
        }

        switch (datatype) {
            case DataType.STRING:
            case DataType.ENUM:
            case DataType.COLOR:
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }

                if (typeof value !== "string") {
                    throw new Error("Value must be a string or a buffer!");
                }

                if (datatype === DataType.ENUM && datatype === this.dataType && this.format.split(",").indexOf(value) < 0) {
                    throw new Error("Value '" + value + "' is invalid for enum with format [" + this.format + "]!");
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
     * @param {string} datatype
     * @return {*}
     */
    unmarshalHomie(value, datatype) {
        if (value === null || value === undefined) {
            return null;
        }

        switch (datatype) {
            case DataType.ENUM:
                if (datatype !== this.dataType) {
                    return value;
                }

                if (this.format.split(",").indexOf(value) < 0) {
                    throw new Error("Value '" + value + "' is invalid for enum with format [" + this.format + "]!");
                }

                return value;
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
