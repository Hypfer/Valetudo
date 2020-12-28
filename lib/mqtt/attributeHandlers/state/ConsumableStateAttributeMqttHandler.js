const StateAttributeMqttHandler = require("./StateAttributeMqttHandler");
const {ConsumableStateAttribute} = require("../../../entities/state/attributes");

class ConsumableStateAttributeMqttHandler extends StateAttributeMqttHandler {

    /**
     * @public
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.autoconfPrefix
     * @param {string} options.identifier
     * @param {object} options.deviceSpecification
     * @param {string} options.availabilityTopic There's only one because there can only be one LWT
     */
    getAutoConfData(options) {
        return {
            topic: options.autoconfPrefix + "/sensor/" + options.identifier + "/" +
                   this.attribute.__class + "_" + this.getIdentifier("_") + "/config",
            payload: { //TODO: expire_after? //TODO:  force_update ? //TODO: icon?
                availability_topic: options.availabilityTopic,
                device: options.deviceSpecification,
                name: this.name,
                state_topic: this.getStateTopic({
                    topicPrefix: options.topicPrefix,
                    identifier: options.identifier
                }),
                unique_id: options.identifier + "_" + this.attribute.__class + "_" + this.getIdentifier("_"),
                unit_of_measurement: this.unit,
                icon: this.icon
            }
        };
    }

    /**
     * @public
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.identifier
     */
    getStateTopic(options) {
        return options.topicPrefix + "/" + options.identifier + "/" + this.attribute.__class + "_" + this.getIdentifier("_") + "/state";
    }

    /**
     * @public
     *
     * @returns {Array | boolean | object | number | string}
     */
    getPayload() {
        return this.attribute.remaining.value;
    }

    /**
     * @private
     *
     * @returns {string}
     */
    get unit() {
        switch (this.attribute.remaining.unit) {
            case ConsumableStateAttribute.UNITS.MINUTES:
                return "Minutes";
            case ConsumableStateAttribute.UNITS.PERCENT:
                return "%";
            default:
                return "";
        }
    }

    /**
     * @private
     *
     * @returns {string}
     */
    get name() {
        let name = "";
        switch (this.attribute.subType) {
            case ConsumableStateAttribute.SUB_TYPE.MAIN:
                name += "Main ";
                break;
            case ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT:
                name += "Right Side ";
                break;
            case ConsumableStateAttribute.SUB_TYPE.SIDE_LEFT:
                name += "Left Side ";
                break;
            case ConsumableStateAttribute.SUB_TYPE.ALL:
            case ConsumableStateAttribute.SUB_TYPE.NONE:
                break;
            default:
                name += this.attribute.subType + " ";
        }

        switch (this.attribute.type) {
            case ConsumableStateAttribute.TYPE.FILTER:
                name += "Filter";
                break;
            case ConsumableStateAttribute.TYPE.BRUSH:
                name += "Brush";
                break;
            case ConsumableStateAttribute.TYPE.SENSOR:
                name += "Sensor";
                break;
            default:
                name += this.attribute.type + " ";

        }

        return name;
    }

    /**
     * @private
     *
     * @returns {string}
     */
    get icon() {
        switch (this.attribute.type) {
            case ConsumableStateAttribute.TYPE.SENSOR:
                return "mdi:progress-clock";
            default:
                return "mdi:progress-wrench";
        }
    }

    /**
     * @private
     * @param {string} separator
     */
    getIdentifier(separator) {
        let identifier = this.attribute.type;

        if (this.attribute.subType !== ConsumableStateAttribute.SUB_TYPE.NONE) {
            identifier += separator;
            identifier += this.attribute.subType;
        }

        return identifier;
    }
}

module.exports = ConsumableStateAttributeMqttHandler;