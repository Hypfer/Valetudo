const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");

const Logger = require("../../../Logger");

/**
 * @extends ConsumableMonitoringCapability<import("../DreameValetudoRobot")>
 */
class Dreame1CConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.reset_main_brush
     * @param {number} options.miot_actions.reset_main_brush.siid
     * @param {number} options.miot_actions.reset_main_brush.aiid
     *
     * @param {object} options.miot_actions.reset_side_brush
     * @param {number} options.miot_actions.reset_side_brush.siid
     * @param {number} options.miot_actions.reset_side_brush.aiid
     *
     * @param {object} options.miot_actions.reset_filter
     * @param {number} options.miot_actions.reset_filter.siid
     * @param {number} options.miot_actions.reset_filter.aiid
     *
     *
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.main_brush
     * @param {number} options.miot_properties.main_brush.siid
     * @param {number} options.miot_properties.main_brush.piid
     *
     * @param {object} options.miot_properties.side_brush
     * @param {number} options.miot_properties.side_brush.siid
     * @param {number} options.miot_properties.side_brush.piid
     *
     * @param {object} options.miot_properties.filter
     * @param {number} options.miot_properties.filter.siid
     * @param {number} options.miot_properties.filter.piid
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }


    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const response = await this.robot.sendCommand("get_properties", [
            this.miot_properties.main_brush,
            this.miot_properties.side_brush,
            this.miot_properties.filter
        ].map(e => {
            return Object.assign({}, e, {did: this.robot.deviceId});
        }));

        if (response) {
            return response.map(elem => {
                return this.parseConsumablesMessage(elem);
            }).filter(elem => {
                return elem instanceof ConsumableStateAttribute;
            });
        } else {
            return [];
        }
    }

    /**
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        let payload;

        switch (type) {
            case ConsumableStateAttribute.TYPE.BRUSH:
                switch (subType) {
                    case ConsumableStateAttribute.SUB_TYPE.MAIN:
                        payload = this.miot_actions.reset_main_brush;
                        break;
                    case ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT:
                        payload = this.miot_actions.reset_side_brush;
                        break;
                }
                break;
            case ConsumableStateAttribute.TYPE.FILTER:
                switch (subType) {
                    case ConsumableStateAttribute.SUB_TYPE.MAIN:
                        payload = this.miot_actions.reset_filter;
                        break;
                }
                break;
        }

        if (payload) {
            await this.robot.sendCommand("action",
                {
                    did: this.robot.deviceId,
                    siid: payload.siid,
                    aiid: payload.aiid,
                    in: []
                }
            ).then(res => {
                if (res.code !== 0) {
                    throw new RobotFirmwareError("Error code " + res.code + " while resetting consumable.");
                }

                this.markEventsAsProcessed(type, subType);
            });
        } else {
            throw new Error("No such consumable");
        }
    }


    parseConsumablesMessage(msg) {
        let consumable;

        switch (msg.siid) {
            case this.miot_properties.main_brush.siid: {
                switch (msg.piid) {
                    case this.miot_properties.main_brush.piid:
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.BRUSH,
                            subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                        break;
                }
                break;
            }
            case this.miot_properties.side_brush.siid: {
                switch (msg.piid) {
                    case this.miot_properties.side_brush.piid:
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.BRUSH,
                            subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                        break;
                }
                break;
            }
            case this.miot_properties.filter.siid: {
                switch (msg.piid) {
                    case this.miot_properties.filter.piid:
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.FILTER,
                            subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                        break;
                }
                break;
            }

            default:
                Logger.warn("Unhandled consumable update", msg);
        }

        if (consumable) {
            this.robot.state.upsertFirstMatchingAttribute(consumable);

            return consumable;
        }
    }

    getProperties() {
        return {
            availableConsumables: [
                {
                    type: ConsumableStateAttribute.TYPE.BRUSH,
                    subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                {
                    type: ConsumableStateAttribute.TYPE.BRUSH,
                    subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                {
                    type: ConsumableStateAttribute.TYPE.FILTER,
                    subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            ]
        };
    }
}

module.exports = Dreame1CConsumableMonitoringCapability;
