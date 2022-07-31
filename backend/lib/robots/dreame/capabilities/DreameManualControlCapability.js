const AttributeSubscriber = require("../../../entities/AttributeSubscriber");
const CallbackAttributeSubscriber = require("../../../entities/CallbackAttributeSubscriber");
const DreameMiotHelper = require("../DreameMiotHelper");
const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");
const StatusStateAttribute = require("../../../entities/state/attributes/StatusStateAttribute");

/**
 * @extends ManualControlCapability<import("../DreameGen2ValetudoRobot")>
 */
class DreameManualControlCapability extends ManualControlCapability {
    /**
     *
     * @param {object} options
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.manual_control
     * @param {number} options.miot_properties.manual_control.siid
     * @param {number} options.miot_properties.manual_control.piid
     *
     * @param {import("../DreameGen2ValetudoRobot")} options.robot
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

        this.miot_properties = options.miot_properties;

        this.keepAliveTimeout = undefined;

        this.robot.state.subscribe(
            new CallbackAttributeSubscriber((eventType, status, prevStatus) => {
                if (
                    eventType === AttributeSubscriber.EVENT_TYPE.CHANGE &&
                    //@ts-ignore
                    status.value !== StatusStateAttribute.VALUE.MANUAL_CONTROL &&
                    prevStatus &&
                    //@ts-ignore
                    prevStatus.value === StatusStateAttribute.VALUE.MANUAL_CONTROL
                ) {
                    this.disableManualControl().then(() => {
                        /* intentional as there is nowhere to send feedback to */
                    }).catch(() => {
                        /* intentional as there is nowhere to send feedback to */
                    });
                }
            }),
            {attributeClass: StatusStateAttribute.name}
        );

        this.lastCommand = new Date(0).getTime();
        this.active = false;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        if (this.active === false) {
            await this.sendRemoteControlCommand(0, 0, true);
            this.active = true;
            await this.sendAndScheduleKeepAlive();
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        clearTimeout(this.keepAliveTimeout);
        this.active = false;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async manualControlActive() {
        return this.active;
    }

    async sendAndScheduleKeepAlive() {
        clearTimeout(this.keepAliveTimeout);

        if (new Date().getTime() - this.lastCommand >= 700) {
            await this.sendRemoteControlCommand(0,0, false);
        }

        this.keepAliveTimeout = setTimeout(async () => {
            await this.sendAndScheduleKeepAlive();
        }, 700);
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        switch (movementCommand) {
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD:
                return this.sendRemoteControlCommand(250, 0, false);
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD:
                return this.sendRemoteControlCommand(-250, 0, false);
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE:
                return this.sendRemoteControlCommand(0, -45, false);
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE:
                return this.sendRemoteControlCommand(0, 45, false);
            default:
                throw new Error("Invalid movementCommand.");
        }
    }

    /**
     * @private
     * @param {number} velocity
     * @param {number} angle
     * @param {boolean} audioHint
     * @returns {Promise<void>}
     */
    async sendRemoteControlCommand(velocity, angle, audioHint) {
        await this.helper.writeProperty(
            this.miot_properties.manual_control.siid,
            this.miot_properties.manual_control.piid,
            JSON.stringify({
                spdv: velocity,
                spdw: angle,
                audio: audioHint === true ? "true" : "false",
                random: Math.floor(Math.random() * 1000)
            })
        );

        this.lastCommand = new Date().getTime();
    }
}

module.exports = DreameManualControlCapability;
