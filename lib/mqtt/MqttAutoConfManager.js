const Tools = require("../Tools");
const capabilities = require("../core/capabilities");
const ValetudoRobot = require("../core/ValetudoRobot");


class MqttAutoConfManager { //TODO: does this thing even make sense?
    /**
     *
     * @param {object} options
     * @param {ValetudoRobot} options.robot
     * @param {string} [options.identifier]
     * @param {string} [options.topicPrefix]
     * @param {string} [options.autoconfPrefix]
     */
    constructor(options) {
        this.robot = options.robot;

        this.identifier = options.identifier || "robot";
        this.topicPrefix = options.topicPrefix || "valetudo";
        this.autoconfPrefix = options.autoconfPrefix || "homeassistant";


        /**
         * We're defining all of them, but not all of them will be used by all robots.
         *
         * This is done, because checking for the availability of a supported feature here
         * would cause iteration of all capabilities on each access to any topic constant
         *
         * Unless of course V8 caches the result of that iteration but I don't think that
         * it is that smart nor that one should rely on that.
         */
        this.internalTopics = {
            availability: this.topicPrefix + "/" + this.identifier + "/status",
            command: this.topicPrefix + "/" + this.identifier + "/command",
            state: this.topicPrefix + "/" + this.identifier + "/state",
            set_fan_speed: this.topicPrefix + "/" + this.identifier + "/set_fan_speed",

            custom_command: this.topicPrefix + "/" + this.identifier + "/custom_command", //TODO: maybe merge this with the regular command topic?

            map_data: this.topicPrefix + "/" + this.identifier + "/map_data"
        };

        this.internalAutoconfData = [
            {
                topic: this.autoconfPrefix + "/vacuum/" + this.topicPrefix + "_" + this.identifier + "/config",
                payload: {
                    name: this.identifier,
                    unique_id: this.identifier,
                    device: this.deviceSpecification,
                    schema: "state",
                    supported_features: this.supportedFeatures,
                    availability_topic: this.topics.availability,
                    command_topic: this.topics.command,
                    state_topic: this.topics.state,
                    set_fan_speed_topic: this.supportedFeatures.includes("fan_speed") ? this.topics.set_fan_speed : undefined,
                    fan_speed_list: this.supportedFeatures.includes("fan_speed") ? this.robot.capabilities.FanSpeedControlCapability.getPresets() : undefined
                }
            }
            //Since the map_data will kill the recorder: component, we can't add autoconfig for it (yet) :(
        ];


        this.registeredTopics = {};
        this.registeredAutoconfData = [];


    }

    get deviceSpecification() {
        return {
            manufacturer: this.robot.getManufacturer(),
            model: this.robot.getModelName(),
            name: this.identifier,
            identifiers: [this.identifier],
            sw_version: Tools.GET_VALETUDO_VERSION() + " (Valetudo)"
        };
    }

    get supportedFeatures() {
        const features = [
            "battery",
            "status"
        ];


        if (this.robot.capabilities[capabilities.BasicControlCapability.TYPE]) {
            features.push("start", "pause", "stop", "return_home");
        }

        if (this.robot.capabilities[capabilities.LocateCapability.TYPE]) {
            features.push("locate");
        }

        if (this.robot.capabilities[capabilities.FanSpeedControlCapability.TYPE]) {
            features.push("fan_speed");
        }


        return features;
    }

    get topics() {
        return Object.assign({}, this.registeredTopics, this.internalTopics);
    }

    get autoconfData() {
        return [].concat(this.registeredAutoconfData, this.internalAutoconfData);
    }

    registerTopic(key, value) {
        this.registeredTopics[key] = value;
    }

    registerAutoconfData(data) {
        this.registeredAutoconfData.push(data);
    }
}

module.exports = MqttAutoConfManager;
