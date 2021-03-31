/**
 * Getter callback for MQTT topics. This callback should return a value that is compatible
 * with the specified data type. The library will perform the required conversions.
 *
 * See comments in homie/DataType for available conversions.
 *
 * @callback getterCallback
 * @return {Promise<*>}
 */

/**
 * Setter callback for MQTT topics. This callback will be given a JavaScript value, converted
 * based on the specified data type..
 *
 * @callback setterCallback
 * @param {*} value
 * @return {Promise<void>}
 */

const DataType = require("./homie/DataType");
const iso8601 = require("../utils/iso8601");
const MqttHandle = require("./MqttHandle");

/**
 * A PropertyMqttHandle represents one single property that each NodeMqttHandle (capability) provides.
 * It is statically typed - as in you specify a data type, you publish data of that type and you expect to receive
 * data of the same type.
 * Protocol validation shall be performed by this base class. Children may perform their own high-level validation.
 *
 * Note that there are no arrays. Capabilities that provide lists from which the user may select an option  may be
 * transformed into enums where possible, they may provide their own special functionality using strings or they may
 * add or remove properties dynamically.
 */
class PropertyMqttHandle extends MqttHandle {
    /**
     * Please see https://homieiot.github.io/specification/spec-core-develop//#property-attributes
     * for more details
     *
     * Setter and getter are mutually optional. At least one of them has to be provided.
     * Providing only "getter" will result in a read-only property.
     * Providing only "setter" will result in a command property, and a getter will be
     * provided that reflects the set value back to MQTT.
     *
     * topicName must follow the Topic ID format: https://homieiot.github.io/specification/spec-core-develop/#topic-ids
     *
     * @param {object} options
     * @param {string} options.topicName Topic ID following the linked format
     * @param {string} options.friendlyName User-friendly name for this property
     * @param {getterCallback} [options.getter] Getter coroutine
     * @param {setterCallback} [options.setter] Setter coroutine
     * @param {import(./homie/DataType)} options.datatype Data type for this property
     * @param {import(./homie/Unit)} [options.unit] Optional unit for this property
     * @param {string} [options.format] Restrictions or options based on the given datatype
     * @param {boolean} [options.retained] Whether to retain this property, default true
     */
    constructor(options) {
        super();

        // These value will be set by registerProperty
        /** @type {import(./MqttController)} */
        this.controller = null;
        /** @type {import(./NodeMqttHandler)} */
        this.node = null;

        this.topicName = options.topicName;
        this.friendlyName = options.friendlyName;
        this.dataType = options.datatype;
        this.unit = options.unit;
        this.format = options.format;
        this.retained = options.retained === undefined ? true : options.retained;
        this.getter = options.getter;
        this.setter = options.setter;

        this.settable = options.setter !== undefined;
        this.isCommand = options.getter === undefined;

        this.lastSetValue = null;

        this.configured = false;

        if (this.setter === this.getter === undefined) {
            throw new Error("At least one of setter and getter must be defined!");
        }
    }

    getBaseTopic() {
        return "";
    }

    /**
     * Returns Homie attributes for the current property
     *
     * @return {object}
     */
    getHomieAttributes() {
        let result = {
            "$name": this.friendlyName,
            "$datatype": this.dataType,
            "$settable": this.settable,
            "$retained": this.retained,
        };
        if (this.unit !== undefined) {
            result["$unit"] = this.unit;
        }
        if (this.format !== undefined) {
            result["$format"] = this.format;
        }
        return result;
    }

    /**
     * Configure this property. It will re-publish all autodiscovery-related attributes.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @return {Promise<void>}
     */
    async configure() {
        if (this.controller.isInitialized()) {
            throw new Error("Properties may only be configured while the MQTT controller is not initialized");
        }
        if (this.configured) {
            throw new Error("Property is already configured");
        }
        // TODO publish attributes
    }

    /**
     * Deconfigure this property. It will publish zero-byte payloads to all property attributes..
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @return {Promise<void>}
     */
    async deconfigure() {
        if (this.controller.isInitialized()) {
            throw new Error("Properties may only be deconfigured while the MQTT controller is not initialized");
        }
        if (!this.configured) {
            throw new Error("Property is already deconfigured");
        }
        // TODO publish zero-length payloads
    }

    /**
     * @package
     * @param {import(./MqttController)|null} controller
     */
    setController(controller) {
        this.controller = controller;
    }

    /**
     * @package
     * @param {import(./NodeMqttHandler)|null} node
     */
    setNode(node) {
        this.node = node;
    }

    /**
     * This method can be used as an event handler to republish this property.
     *
     * @return {Promise<void>}
     */
    async onChange() {
        await this.controller.refreshProperty(this);
    }

    /**
     * Used by MqttController to retrieve the value of this property to be published for Homie
     *
     * @package
     * @return {Promise<string|null>}
     */
    async getHomie() {
        if (this.isCommand) {
            if (this.lastSetValue === null || this.lastSetValue === undefined) {
                return null;
            }
            return this.marshalHomie(this.lastSetValue);
        } else {
            return this.marshalHomie(await this.getter());
        }
    }

    /**
     * Used by MqttController to hand over a value set over MQTT
     *
     * @package
     * @param {string} value
     * @return {Promise<void>}
     */
    async setHomie(value) {
        if (!this.settable) {
            return;
        }
        const converted = this.unmarshalHomie(value);
        await this.setter(converted);
        if (this.isCommand) {
            this.lastSetValue = converted;
            await this.controller.refreshProperty(this);
        }
    }

    /**
     * Converts a JS value to a Homie-compatible value, based on the provided data type
     *
     * @private
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
     * @private
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

module.exports = PropertyMqttHandle;
