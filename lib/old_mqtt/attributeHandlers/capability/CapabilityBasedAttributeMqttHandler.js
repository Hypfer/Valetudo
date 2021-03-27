const Capability = require("../../../core/capabilities/Capability");
const NotImplementedError = require("../../../core/NotImplementedError");

class CapabilityBasedAttributeMqttHandler {
    /**
     *
     * @param {object} options
     * @param {Capability|*} options.capability
     */
    constructor(options) {
        this.capability = options.capability;
    }

    /**
     * @public
     * @abstract
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.autoconfPrefix
     * @param {string} options.identifier
     * @param {object} options.deviceSpecification
     * @param {string} options.availabilityTopic There's only one because there can only be one LWT
     */
    getAutoConfData(options) {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.identifier
     */
    getStateTopic(options) {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     *
     * @returns {Promise<Array | boolean | object | number | string>}
     */
    async getPayload() {
        throw new NotImplementedError();
    }
}

module.exports = CapabilityBasedAttributeMqttHandler;
