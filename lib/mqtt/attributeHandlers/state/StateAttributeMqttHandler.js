const StateAttribute = require("../../../entities/state/attributes/StateAttribute");
const NotImplementedError = require("../../../core/NotImplementedError");

class StateAttributeMqttHandler {
    /**
     *
     * @param {object} options
     * @param {StateAttribute|*} options.attribute
     */
    constructor(options) {
        this.attribute = options.attribute;
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
     * @returns {Array | boolean | object | number | string}
     */
    getPayload() {
        throw new NotImplementedError();
    }
}

module.exports = StateAttributeMqttHandler;
