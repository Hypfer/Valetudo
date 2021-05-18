const express = require("express");
const ValetudoTimer = require("../entities/core/ValetudoTimer");

class TimerRouter {
    /**
     *
     * @param {object} options
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(this.config.get("timers"));
        });

        this.router.get("/:id", (req, res) => {
            const timer = this.config.get("timers")[req.params.id];

            if (timer) {
                res.json(timer);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.post("/", (req, res) => {
            if (
                req.body &&
                Array.isArray(req.body.dow) &&
                typeof req.body.hour === "number" &&
                typeof req.body.minute === "number" &&
                req.body.action && typeof req.body.action.type === "string"
            ) {
                const storedTimers = this.config.get("timers");
                const newTimer = new ValetudoTimer({
                    enabled: req.body.enabled === true,
                    dow: req.body.dow,
                    hour: req.body.hour,
                    minute: req.body.minute,
                    action: req.body.action
                });

                storedTimers[newTimer.id] = newTimer;

                this.config.set("timers", storedTimers);
                res.sendStatus(201);
            } else {
                res.sendStatus(400);
            }
        });

        this.router.post("/:id", (req, res) => {
            const storedTimers = this.config.get("timers");

            if (storedTimers[req.params.id]) {
                if (
                    req.body &&
                    Array.isArray(req.body.dow) &&
                    typeof req.body.hour === "number" &&
                    typeof req.body.minute === "number" &&
                    req.body.action && typeof req.body.action.type === "string"
                ) {
                    const storedTimers = this.config.get("timers");
                    const newTimer = new ValetudoTimer({
                        id: req.params.id,
                        enabled: req.body.enabled === true,
                        dow: req.body.dow,
                        hour: req.body.hour,
                        minute: req.body.minute,
                        action: req.body.action
                    });

                    storedTimers[newTimer.id] = newTimer;

                    this.config.set("timers", storedTimers);
                    res.sendStatus(200);
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
}

module.exports = TimerRouter;
