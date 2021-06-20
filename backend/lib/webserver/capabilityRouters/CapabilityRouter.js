const express = require("express");

const NotImplementedError = require("../../core/NotImplementedError");

class CapabilityRouter {
    /**
     *
     * @param {object} options
     * @param {import("../../core/capabilities/Capability") | any} options.capability
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});
        this.capability = options.capability;

        this.validator = options.validator;

        this.router.get("/properties", (req, res) => {
            res.json(this.capability.getProperties());
        });

        this.initRoutes();
    }

    /**
     * @abstract
     * @protected
     */
    initRoutes() {
        throw new NotImplementedError();
    }

    getRouter() {
        return this.router;
    }
}

module.exports = CapabilityRouter;
