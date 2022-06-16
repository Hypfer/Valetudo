const express = require("express");

class ValetudoEventRouter {
    /**
     *
     * @param {object} options
     * @param {import("../ValetudoEventStore")} options.valetudoEventStore
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.valetudoEventStore = options.valetudoEventStore;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(this.valetudoEventStore.getAll());
        });

        this.router.get("/:id", (req, res) => {
            const event = this.valetudoEventStore.getById(req.params.id);

            if (event) {
                res.json(event);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.put("/:id/interact", this.validator, async (req, res) => {
            const event = this.valetudoEventStore.getById(req.params.id);

            if (event) {
                if (req.body.interaction) {
                    try {
                        await this.valetudoEventStore.interact(event, req.body.interaction);
                    } catch (e) {
                        return res.status(400).send("Failed to interact with event: " + e?.message);
                    }

                    res.json(event);
                } else {
                    res.status(400).send("Missing or invalid request body");
                }
            } else {
                res.sendStatus(404);
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = ValetudoEventRouter;
