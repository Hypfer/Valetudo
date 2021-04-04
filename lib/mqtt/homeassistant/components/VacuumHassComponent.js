const HassComponent = require("./HassComponent");
const HassAnchor = require("../HassAnchor");
const capabilities = require("../../../core/capabilities");
const Commands = require("../../common/Commands");
const ComponentType = require("../ComponentType");

class VacuumHassComponent extends HassComponent {
    /**
     * @param {object} options
     * @param {import("../HassController")} options.hass
     * @param {import("../../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            componentType: ComponentType.VACUUM,
            componentId: options.hass.identifier + "_vacuum"
        }));
    }

    getAutoconf() {
        const result = {
            name: this.hass.friendlyName,
            unique_id: this.componentId,
            schema: "state",
            supported_features: [
                "battery",
                "status",
                "start",
                "stop",
                "pause",
                "return_home"
            ],
            state_topic: this.getBaseTopic() + "/state",
            command_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.BASIC_CONTROL_COMMAND),
            payload_start: Commands.BASIC_CONTROL.START,
            payload_pause: Commands.BASIC_CONTROL.PAUSE,
            payload_return_to_base: Commands.BASIC_CONTROL.HOME,
            payload_stop: Commands.BASIC_CONTROL.STOP,
        };
        if (this.robot.hasCapability(capabilities.FanSpeedControlCapability.TYPE)) {
            result["supported_features"].push("fan_speed");
            result["fan_speed_topic"] = HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED);
            result["fan_speed_template"] = "{{ value }}";
            // Sent as a topic reference since this is used for the autoconfig
            result["fan_speed_list"] = HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED_PRESETS);
            result["set_fan_speed_topic"] = HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED_SET);
        }
        return result;
    }


    getTopics() {
        return {
            "state": {
                "state": HassAnchor.getAnchor(HassAnchor.ANCHOR.VACUUM_STATE),
                "battery_level": HassAnchor.getAnchor(HassAnchor.ANCHOR.BATTERY_LEVEL),
            }
        };
    }
}

module.exports = VacuumHassComponent;