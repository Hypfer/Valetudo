const capabilities = require("../../../core/capabilities");
const Commands = require("../../common/Commands");
const ComponentType = require("../ComponentType");
const HassAnchor = require("../HassAnchor");
const HassComponent = require("./HassComponent");

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

        this.basicControlCap = this.robot.capabilities[capabilities.BasicControlCapability.TYPE];
        this.locateCap = this.robot.capabilities[capabilities.LocateCapability.TYPE];
    }

    getAutoconf() {
        const result = {
            name: "Robot",
            object_id: this.hass.objectId,
            supported_features: [
                "status",
                "start",
                "stop",
                "pause",
                "return_home"
            ],
            state_topic: this.getBaseTopic() + "/state",
            command_topic: this.getBaseTopic() + "/command",
            payload_start: Commands.BASIC_CONTROL.START,
            payload_pause: Commands.BASIC_CONTROL.PAUSE,
            payload_return_to_base: Commands.BASIC_CONTROL.HOME,
            payload_stop: Commands.BASIC_CONTROL.STOP,
            payload_locate: Commands.HASS.LOCATE,
        };

        if (this.robot.hasCapability(capabilities.FanSpeedControlCapability.TYPE)) {
            result["supported_features"].push("fan_speed");

            // Sent as a topic reference since this is used for the autoconfig
            result["fan_speed_list"] = this.hass.controller.hassAnchorProvider.getTopicReference(
                HassAnchor.REFERENCE.FAN_SPEED_PRESETS
            );
            result["set_fan_speed_topic"] = this.hass.controller.hassAnchorProvider.getTopicReference(
                HassAnchor.REFERENCE.FAN_SPEED_SET
            );
        }

        if (this.locateCap !== undefined) {
            result["supported_features"].push("locate");
        }

        return result;
    }


    getTopics() {
        const result = {
            "state": {
                "state": this.hass.controller.hassAnchorProvider.getAnchor(
                    HassAnchor.ANCHOR.VACUUM_STATE
                ),
            }
        };
        if (this.robot.hasCapability(capabilities.FanSpeedControlCapability.TYPE)) {
            result.state.fan_speed = this.hass.controller.hassAnchorProvider.getAnchor(
                HassAnchor.ANCHOR.FAN_SPEED
            );
        }
        return result;
    }


    getInterestingTopics() {
        return {
            [this.getBaseTopic() + "/command"]: async (value) => {
                switch (value) {
                    case Commands.BASIC_CONTROL.START:
                        await this.basicControlCap.start();
                        break;
                    case Commands.BASIC_CONTROL.STOP:
                        await this.basicControlCap.stop();
                        break;
                    case Commands.BASIC_CONTROL.PAUSE:
                        await this.basicControlCap.pause();
                        break;
                    case Commands.BASIC_CONTROL.HOME:
                        await this.basicControlCap.home();
                        break;
                    case Commands.HASS.LOCATE:
                        await this.locateCap?.locate();
                        break;
                }
            },
        };
    }
}

module.exports = VacuumHassComponent;
