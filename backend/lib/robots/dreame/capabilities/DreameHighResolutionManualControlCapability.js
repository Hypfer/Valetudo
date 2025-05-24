const AttributeSubscriber = require("../../../entities/AttributeSubscriber");
const CallbackAttributeSubscriber = require("../../../entities/CallbackAttributeSubscriber");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const HighResolutionManualControlCapability = require("../../../core/capabilities/HighResolutionManualControlCapability");
const StatusStateAttribute = require("../../../entities/state/attributes/StatusStateAttribute");

/**
 * @extends HighResolutionManualControlCapability<import("../DreameGen2ValetudoRobot")>
 */
class DreameHighResolutionManualControlCapability extends HighResolutionManualControlCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameGen2ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.miot_properties = {
            manual_control: {
                siid: DreameMiotServices["GEN2"].VACUUM_2.SIID,
                piid: DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MANUAL_CONTROL.PIID
            }
        };

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
            await this.sendRemoteControlCommand(0, 0, false);
        }

        this.keepAliveTimeout = setTimeout(async () => {
            await this.sendAndScheduleKeepAlive();
        }, 700);
    }

    /**
     * @param {import("../../../entities/core/ValetudoManualMovementVector")} vector
     * @returns {Promise<void>}
     */
    async manualControl(vector) {
        return this.sendRemoteControlCommand(
            Math.round(vector.velocity * 300),
            Math.round(vector.angle * -1),
            false
        );
    }

    /**
     * @private
     * @param {number} velocity must be int
     * @param {number} angle must be int
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

module.exports = DreameHighResolutionManualControlCapability;
