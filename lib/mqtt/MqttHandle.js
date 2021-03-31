const NotImplementedError = require("../core/NotImplementedError");

/**
 * This abstract class represents a handle to an arbitrary level of the Homie MQTT hierarchy.
 * Children must be able to provide Homie attributes and a base topic.
 *
 * @abstract
 */
class MqttHandle {
    /**
     * Return the base topic for this handle.
     *
     * @abstract
     * @return {string}
     */
    getBaseTopic() {
        throw new NotImplementedError();
    }

    /**
     * Returns Homie attributes for the current handle.
     *
     * @abstract
     * @return {object}
     */
    getHomieAttributes() {
        throw new NotImplementedError();
    }

    /**
     * Configure this handle. It will re-publish all autodiscovery-related attributes.
     * It will not configure any children handles.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @abstract
     * @return {Promise<void>}
     */
    async configure() {
        throw new NotImplementedError();
    }

    /**
     * Deconfigure this handle. It will publish zero-length payloads to all autodiscovery-related attributes.
     * It will not deconfigure any children handles.
     * This function must be used as a callback of the controller's reconfigure method so that the state is updated
     * accordingly.
     *
     * @abstract
     * @return {Promise<void>}
     */
    async deconfigure() {
        throw new NotImplementedError();
    }
}

module.exports = MqttHandle;
