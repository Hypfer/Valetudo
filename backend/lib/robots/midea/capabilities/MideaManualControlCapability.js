const AttributeSubscriber = require("../../../entities/AttributeSubscriber");
const CallbackAttributeSubscriber = require("../../../entities/CallbackAttributeSubscriber");
const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const StatusStateAttribute = require("../../../entities/state/attributes/StatusStateAttribute");
const {sleep} = require("../../../utils/misc");

// FIXME: This doesn't feel good enough to be used

/**
 * @extends ManualControlCapability<import("../MideaValetudoRobot")>
 */
class MideaManualControlCapability extends ManualControlCapability {
    /**
     * @param {object} options
     * @param {import("../MideaValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign({}, options, {
            supportedMovementCommands: [
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE,
            ]
        }));

        this.active = false;
        this.keepAliveTimeout = undefined;
        this.lastCommand = new Date(0).getTime();

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
                    this.disableManualControl().catch(() => {});
                }
            }),
            {attributeClass: StatusStateAttribute.name}
        );
    }

    /**
     * @private
     * @param {number} direction The direction parameter byte (0x0D)
     * @returns {Promise<void>}
     */
    async sendMovementCommand(direction) {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.DO_MANUAL_CONTROL_CMD,
                Buffer.from([
                    direction,
                    MIDEA_MANUAL_CONTROL_MODE.CRUISE
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
        this.lastCommand = new Date().getTime();
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async scheduleKeepAlive() {
        clearTimeout(this.keepAliveTimeout);

        if (this.active) {
            if (new Date().getTime() - this.lastCommand >= KEEP_ALIVE_INTERVAL) {
                await this.sendMovementCommand(MIDEA_MANUAL_CONTROL_DIRECTION.STOP);
            }

            this.keepAliveTimeout = setTimeout(() => {
                this.scheduleKeepAlive().catch(() => {
                    /* intentional */
                });
            }, KEEP_ALIVE_INTERVAL);
        }
    }


    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        if (!this.active) {
            this.active = true;

            await this.sendMovementCommand(MIDEA_MANUAL_CONTROL_DIRECTION.STOP);
            await this.robot.pollState();

            await this.scheduleKeepAlive();
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        if (this.active) {
            clearTimeout(this.keepAliveTimeout);
            this.keepAliveTimeout = undefined;
            this.active = false;

            await this.robot.pollState();
        }
    }

    /**
     * @returns {Promise<boolean>}
     */
    async manualControlActive() {
        return this.active;
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        let direction;

        switch (movementCommand) {
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD:
                direction = MIDEA_MANUAL_CONTROL_DIRECTION.FORWARD;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE:
                direction = MIDEA_MANUAL_CONTROL_DIRECTION.RIGHT;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE:
                direction = MIDEA_MANUAL_CONTROL_DIRECTION.LEFT;
                break;
            default:
                throw new Error("Invalid movementCommand");
        }

        await this.sendMovementCommand(direction);
        await sleep(500);
        await this.sendMovementCommand(MIDEA_MANUAL_CONTROL_DIRECTION.STOP); // FIXME: this feels terrible but so does not having it
    }
}

const MIDEA_MANUAL_CONTROL_DIRECTION = Object.freeze({
    STOP: 0x00,
    FORWARD: 0x01,
    LEFT: 0x03,
    RIGHT: 0x04
});

const MIDEA_MANUAL_CONTROL_MODE = Object.freeze({
    CLEAN: 0x00,
    CRUISE: 0x01
});

const KEEP_ALIVE_INTERVAL = 3000;

module.exports = MideaManualControlCapability;
