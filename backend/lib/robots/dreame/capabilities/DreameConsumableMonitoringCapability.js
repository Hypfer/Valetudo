const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");

/**
 * @extends ConsumableMonitoringCapability<import("../DreameValetudoRobot")>
 */
class DreameConsumableMonitoringCapability extends ConsumableMonitoringCapability {
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
     * @param {object} [options.miot_actions.reset_sensor]
     * @param {number} options.miot_actions.reset_sensor.siid
     * @param {number} options.miot_actions.reset_sensor.aiid
     *
     * @param {object} [options.miot_actions.reset_mop]
     * @param {number} options.miot_actions.reset_mop.siid
     * @param {number} options.miot_actions.reset_mop.aiid
     * 
     * @param {object} [options.miot_actions.reset_secondary_filter]
     * @param {number} options.miot_actions.reset_secondary_filter.siid
     * @param {number} options.miot_actions.reset_secondary_filter.aiid
     * 
     * @param {object} [options.miot_actions.reset_detergent]
     * @param {number} options.miot_actions.reset_detergent.siid
     * @param {number} options.miot_actions.reset_detergent.aiid
     * 
     * @param {object} [options.miot_actions.reset_wheel]
     * @param {number} options.miot_actions.reset_wheel.siid
     * @param {number} options.miot_actions.reset_wheel.aiid
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
     *
     * @param {object} [options.miot_properties.sensor]
     * @param {number} options.miot_properties.sensor.siid
     * @param {number} options.miot_properties.sensor.piid
     *
     * @param {object} [options.miot_properties.mop]
     * @param {number} options.miot_properties.mop.siid
     * @param {number} options.miot_properties.mop.piid
     * 
     * @param {object} [options.miot_properties.secondary_filter]
     * @param {number} options.miot_properties.secondary_filter.siid
     * @param {number} options.miot_properties.secondary_filter.piid
     * 
     * @param {object} [options.miot_properties.detergent]
     * @param {number} options.miot_properties.detergent.siid
     * @param {number} options.miot_properties.detergent.piid
     * 
     * @param {object} [options.miot_properties.wheel]
     * @param {number} options.miot_properties.wheel.siid
     * @param {number} options.miot_properties.wheel.piid
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
        const props = [
            this.miot_properties.main_brush,
            this.miot_properties.side_brush,
            this.miot_properties.filter
        ];

        if (this.miot_properties.sensor) {
            props.push(this.miot_properties.sensor);
        }

        if (this.miot_properties.mop) {
            props.push(this.miot_properties.mop);
        }

        if (this.miot_properties.secondary_filter) {
            props.push(this.miot_properties.secondary_filter);
        }

        if (this.miot_properties.detergent) {
            props.push(this.miot_properties.detergent);
        }

        if (this.miot_properties.wheel) {
            props.push(this.miot_properties.wheel);
        }


        const response = await this.robot.sendCommand("get_properties", props.map(e => {
            return Object.assign({}, e, {did: this.robot.deviceId});
        }));

        if (response) {
            return response.filter(elem => {
                return elem?.code === 0;
            })
                .map(elem => {
                    return this.parseConsumablesMessage(elem);
                })
                .filter(elem => {
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
                    case ConsumableStateAttribute.SUB_TYPE.SECONDARY:
                        payload = this.miot_actions.reset_secondary_filter;
                        break;
                }
                break;
            case ConsumableStateAttribute.TYPE.CLEANING:
                switch (subType) {
                    case ConsumableStateAttribute.SUB_TYPE.SENSOR:
                        if (this.miot_actions.reset_sensor) {
                            payload = this.miot_actions.reset_sensor;
                        }
                        break;
                    case ConsumableStateAttribute.SUB_TYPE.WHEEL:
                        if (this.miot_actions.reset_wheel) {
                            payload = this.miot_actions.reset_wheel;
                        }
                        break;

                }
                break;
            case ConsumableStateAttribute.TYPE.MOP:
                if (this.miot_actions.reset_mop) {
                    switch (subType) {
                        case ConsumableStateAttribute.SUB_TYPE.ALL:
                            payload = this.miot_actions.reset_mop;
                            break;
                    }
                }
                break;
            case ConsumableStateAttribute.TYPE.DETERGENT:
                if (this.miot_actions.reset_detergent) {
                    switch (subType) {
                        case ConsumableStateAttribute.SUB_TYPE.DOCK:
                            payload = this.miot_actions.reset_detergent;
                            break;
                    }
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
                if (
                    this.miot_properties.sensor &&
                    msg.siid === this.miot_properties.sensor.siid
                ) {
                    if (msg.piid === this.miot_properties.sensor.piid) {
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.CLEANING,
                            subType: ConsumableStateAttribute.SUB_TYPE.SENSOR,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                    }
                } else if (
                    this.miot_properties.mop &&
                    msg.siid === this.miot_properties.mop.siid
                ) {
                    if (msg.piid === this.miot_properties.mop.piid) {
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.MOP,
                            subType: ConsumableStateAttribute.SUB_TYPE.ALL,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                    }
                } else if (
                    this.miot_properties.secondary_filter &&
                    msg.siid === this.miot_properties.secondary_filter.siid
                ) {
                    if (msg.piid === this.miot_properties.secondary_filter.piid) {
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.FILTER,
                            subType: ConsumableStateAttribute.SUB_TYPE.SECONDARY,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                    }
                } else if (
                    this.miot_properties.detergent &&
                    msg.siid === this.miot_properties.detergent.siid
                ) {
                    if (msg.piid === this.miot_properties.detergent.piid) {
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.DETERGENT,
                            subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                            remaining: {
                                value: Math.max(0, msg.value),
                                unit: ConsumableStateAttribute.UNITS.PERCENT
                            }
                        });
                    }
                } else if (
                    this.miot_properties.wheel &&
                    msg.siid === this.miot_properties.wheel.siid
                ) {
                    if (msg.piid === this.miot_properties.wheel.piid) {
                        consumable = new ConsumableStateAttribute({
                            type: ConsumableStateAttribute.TYPE.CLEANING,
                            subType: ConsumableStateAttribute.SUB_TYPE.WHEEL,
                            remaining: {
                                value: Math.round(Math.max(0, msg.value * 60)),
                                unit: ConsumableStateAttribute.UNITS.MINUTES
                            }
                        });
                    }
                }
        }

        if (consumable) {
            this.robot.state.upsertFirstMatchingAttribute(consumable);

            return consumable;
        }
    }

    getProperties() {
        /** @type Array<ConsumableMonitoringCapability.ConsumableMeta> **/
        const availableConsumables = [
            {
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 300 * 60
            },
            {
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 200 * 60
            },
            {
                type: ConsumableStateAttribute.TYPE.FILTER,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 150 * 60
            }
        ];

        if (this.miot_properties.sensor) {
            availableConsumables.push(
                {
                    type: ConsumableStateAttribute.TYPE.CLEANING,
                    subType: ConsumableStateAttribute.SUB_TYPE.SENSOR,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 30 * 60
                }
            );
        }

        if (this.miot_properties.mop) {
            availableConsumables.push(
                {
                    type: ConsumableStateAttribute.TYPE.MOP,
                    subType: ConsumableStateAttribute.SUB_TYPE.ALL,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 80 * 60
                }
            );
        }

        if (this.miot_properties.secondary_filter) {
            availableConsumables.push(
                {
                    type: ConsumableStateAttribute.TYPE.FILTER,
                    subType: ConsumableStateAttribute.SUB_TYPE.SECONDARY,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 300 * 60
                }
            );
        }

        if (this.miot_properties.detergent) {
            availableConsumables.push(
                {
                    type: ConsumableStateAttribute.TYPE.DETERGENT,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    unit: ConsumableStateAttribute.UNITS.PERCENT
                }
            );
        }

        if (this.miot_properties.wheel) {
            availableConsumables.push(
                {
                    type: ConsumableStateAttribute.TYPE.CLEANING,
                    subType: ConsumableStateAttribute.SUB_TYPE.WHEEL,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 30 * 60
                }
            );
        }

        return {
            availableConsumables: availableConsumables
        };
    }
}

module.exports = DreameConsumableMonitoringCapability;
