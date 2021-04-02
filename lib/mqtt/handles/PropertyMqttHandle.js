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

const MqttHandle = require("./MqttHandle");
const DataType = require("../homie/DataType");

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
     * @override
     * @param {object} options
     * @param {import("./NodeMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {string} options.topicName Topic ID following the linked format
     * @param {string} options.friendlyName User-friendly name for this property
     * @param {getterCallback} [options.getter] Getter coroutine
     * @param {setterCallback} [options.setter] Setter coroutine
     * @param {import("../homie/DataType")|string} options.datatype Data type for this property
     * @param {import("../homie/Unit")} [options.unit] Optional unit for this property
     * @param {string} [options.format] Restrictions or options based on the given datatype
     * @param {boolean} [options.retained] Whether to retain this property, default true
     */
    constructor(options) {
        // noinspection JSCheckFunctionSignatures
        // @ts-ignore
        super(Object.assign(options, {
            gettable: options.getter !== undefined,
            settable: options.setter !== undefined,
        }));

        this.unit = options.unit;
        this.getter = options.getter;
        this.setter = options.setter;

        if (this.setter === this.getter === undefined) {
            throw new Error("At least one of setter and getter must be defined!");
        }
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
            "$settable": this.marshalHomie(this.settable, DataType.BOOLEAN),
            "$retained": this.marshalHomie(this.retained, DataType.BOOLEAN),
        };
        if (this.unit !== undefined) {
            result["$unit"] = this.unit;
        }
        if (this.format !== undefined) {
            result["$format"] = this.format;
        }
        return result;
    }


    async get() {
        return await this.getter();
    }

    async set(value) {
        return await this.setter(value);
    }
}

module.exports = PropertyMqttHandle;
