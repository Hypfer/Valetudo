const BasicControlCapability = require("../core/capabilities/BasicControlCapability");
const express = require("express");
const FanSpeedControlCapability = require("../core/capabilities/FanSpeedControlCapability");
const MapSegmentationCapability = require("../core/capabilities/MapSegmentationCapability");
const OperationModeControlCapability = require("../core/capabilities/OperationModeControlCapability");
const ValetudoTimer = require("../entities/core/ValetudoTimer");
const WaterUsageControlCapability = require("../core/capabilities/WaterUsageControlCapability");

class TimerRouter {
    /**
     *
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.robot = options.robot;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(this.config.get("timers"));
        });

        this.router.get("/properties", (req, res) => {
            const response = {
                supportedActions: [],
                supportedPreActions: []
            };

            if (this.robot.hasCapability(BasicControlCapability.TYPE)) {
                response.supportedActions.push(ValetudoTimer.ACTION_TYPE.FULL_CLEANUP);
            }

            if (this.robot.hasCapability(MapSegmentationCapability.TYPE)) {
                response.supportedActions.push(ValetudoTimer.ACTION_TYPE.SEGMENT_CLEANUP);
            }



            if (this.robot.hasCapability(FanSpeedControlCapability.TYPE)) {
                response.supportedPreActions.push(ValetudoTimer.PRE_ACTION_TYPE.FAN_SPEED_CONTROL);
            }

            if (this.robot.hasCapability(WaterUsageControlCapability.TYPE)) {
                response.supportedPreActions.push(ValetudoTimer.PRE_ACTION_TYPE.WATER_USAGE_CONTROL);
            }

            if (this.robot.hasCapability(OperationModeControlCapability.TYPE)) {
                response.supportedPreActions.push(ValetudoTimer.PRE_ACTION_TYPE.OPERATION_MODE_CONTROL);
            }

            res.json(response);
        });

        this.router.get("/:id", (req, res) => {
            const timer = this.config.get("timers")[req.params.id];

            if (timer) {
                res.json(timer);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.post("/", this.validator, (req, res) => {
            if (
                req.body &&
                Array.isArray(req.body.dow) &&
                typeof req.body.hour === "number" &&
                typeof req.body.minute === "number" &&
                req.body.action && typeof req.body.action.type === "string"
            ) {
                const action = TimerRouter.MAP_ACTION_FROM_BODY(req.body);
                const preActions = TimerRouter.MAP_PRE_ACTIONS_FROM_BODY(req.body);

                if (!action) {
                    res.sendStatus(400);
                } else {
                    const storedTimers = this.config.get("timers");
                    const newTimer = new ValetudoTimer({
                        enabled: req.body.enabled === true,
                        dow: req.body.dow,
                        hour: req.body.hour,
                        minute: req.body.minute,
                        action: action,
                        pre_actions: preActions
                    });

                    storedTimers[newTimer.id] = newTimer;

                    this.config.set("timers", storedTimers);
                    res.sendStatus(200);
                }

            } else {
                res.sendStatus(400);
            }
        });

        this.router.put("/:id", this.validator, (req, res) => {
            const storedTimers = this.config.get("timers");

            if (storedTimers[req.params.id]) {
                if (
                    req.body &&
                    Array.isArray(req.body.dow) &&
                    typeof req.body.hour === "number" &&
                    typeof req.body.minute === "number" &&
                    req.body.action && typeof req.body.action.type === "string"
                ) {
                    const action = TimerRouter.MAP_ACTION_FROM_BODY(req.body);
                    const preActions = TimerRouter.MAP_PRE_ACTIONS_FROM_BODY(req.body);

                    if (!action) {
                        res.sendStatus(400);
                    } else {
                        const newTimer = new ValetudoTimer({
                            id: req.params.id,
                            enabled: req.body.enabled === true,
                            dow: req.body.dow,
                            hour: req.body.hour,
                            minute: req.body.minute,
                            action: action,
                            pre_actions: preActions
                        });

                        storedTimers[newTimer.id] = newTimer;

                        this.config.set("timers", storedTimers);
                        res.sendStatus(200);
                    }
                } else {
                    res.sendStatus(400);
                }
            } else {
                res.sendStatus(404);
            }
        });

        this.router.delete("/:id", (req, res) => {
            const timers = this.config.get("timers");

            if (timers[req.params.id]) {
                delete(timers[req.params.id]);

                this.config.set("timers", timers);

                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        });
    }

    getRouter() {
        return this.router;
    }

    /**
     * @private
     * @param {object} body
     */
    static MAP_ACTION_FROM_BODY(body) {
        let action;

        switch (body.action.type) {
            case ValetudoTimer.ACTION_TYPE.FULL_CLEANUP:
                action = {
                    type: ValetudoTimer.ACTION_TYPE.FULL_CLEANUP,
                    params: {}
                };
                break;
            case ValetudoTimer.ACTION_TYPE.SEGMENT_CLEANUP:
                action = {
                    type: ValetudoTimer.ACTION_TYPE.SEGMENT_CLEANUP,
                    params: {
                        segment_ids: body.action.params.segment_ids,
                        iterations: body.action.params.iterations,
                        custom_order: body.action.params.custom_order,
                    }
                };
                break;
        }

        return action;
    }

    /**
     * @private
     * @param {object} body
     */
    static MAP_PRE_ACTIONS_FROM_BODY(body) {
        const preActions = [];

        if (Array.isArray(body.pre_actions)) {
            for (const preActionFromBody of body.pre_actions) {
                switch (preActionFromBody.type) {
                    case ValetudoTimer.PRE_ACTION_TYPE.FAN_SPEED_CONTROL:
                        preActions.push({
                            type: ValetudoTimer.PRE_ACTION_TYPE.FAN_SPEED_CONTROL,
                            params: {
                                value: preActionFromBody.params.value
                            }
                        });
                        break;
                    case ValetudoTimer.PRE_ACTION_TYPE.WATER_USAGE_CONTROL:
                        preActions.push({
                            type: ValetudoTimer.PRE_ACTION_TYPE.WATER_USAGE_CONTROL,
                            params: {
                                value: preActionFromBody.params.value
                            }
                        });
                        break;
                    case ValetudoTimer.PRE_ACTION_TYPE.OPERATION_MODE_CONTROL:
                        preActions.push({
                            type: ValetudoTimer.PRE_ACTION_TYPE.OPERATION_MODE_CONTROL,
                            params: {
                                value: preActionFromBody.params.value
                            }
                        });
                        break;
                }
            }
        }

        return preActions;
    }
}

module.exports = TimerRouter;
