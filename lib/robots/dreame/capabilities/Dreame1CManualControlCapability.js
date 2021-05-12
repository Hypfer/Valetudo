/*
_this.sendRemoteCtrl = function (touchId) {
        var v = 0;
        var wv = 0;

        if (touchId == 1) {
          v = 300;
          wv = 0;
        } else if (touchId == 2) {
          v = 0;
          wv = 80;
        } else if (touchId == 3) {
          v = 0;
          wv = -80;
        } else {
          return;
        }

        _miot.Device.getDeviceWifi().callMethod("action", {
          "did": did,
          "siid": 21,
          "aiid": 1,
          "in": [{
            "piid": 1,
            "value": "" + wv
          }, {
            "piid": 2,
            "value": "" + v
          }]
        }).then(function (res) {}).catch(function (err) {});
*/

const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");

/**
 * @extends ManualControlCapability<import("../Dreame1CValetudoRobot")>
 */
class RoborockManualControlCapability extends ManualControlCapability {
    /**
     *
     * @param {object} options
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.stop
     * @param {number} options.miot_actions.stop.siid
     * @param {number} options.miot_actions.stop.aiid
     * @param {object} options.miot_actions.move
     * @param {number} options.miot_actions.move.siid
     * @param {number} options.miot_actions.move.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.velocity
     * @param {number} options.miot_properties.velocity.piid
     * @param {object} options.miot_properties.angle
     * @param {number} options.miot_properties.angle.piid
     *
     * @param {import("../Dreame1CValetudoRobot")} options.robot
     * @class
     */
    constructor(options) {
        super(Object.assign({}, options, {
            supportedMovementCommands: [
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE
            ]
        }));

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }

    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        return this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.miot_actions.move.siid,
            aiid: this.miot_actions.move.aiid,
            in: [
                {
                    "piid": this.miot_properties.angle.piid,
                    "value": "0"
                },
                {
                    "piid": this.miot_properties.velocity.piid,
                    "value": "0"
                }
            ]
        }, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        return this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.miot_actions.stop.siid,
            aiid: this.miot_actions.stop.aiid,
            in: []
        }, {});
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        let angle = 0;
        let velocity = 0;

        switch (movementCommand) {
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD:
                velocity = 180;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD:
                velocity = -180;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE:
                angle = -80;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE:
                angle = 80;
                break;
            default:
                throw new Error("Invalid movementCommand.");
        }

        return this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.miot_actions.move.siid,
            aiid: this.miot_actions.move.aiid,
            in: [
                {
                    "piid": this.miot_properties.angle.piid,
                    "value": `${angle}`
                },
                {
                    "piid": this.miot_properties.velocity.piid,
                    "value": `${velocity}`
                }
            ]
        }, {});
    }
}

module.exports = RoborockManualControlCapability;
