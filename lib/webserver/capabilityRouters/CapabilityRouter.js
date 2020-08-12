const express = require("express");

const NotImplementedError = require("../../core/NotImplementedError");

class CapabilityRouter {
    /**
     *
     * @param options {object}
     * @param options.capability {import("../../core/capabilities/Capability") | any}
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});
        this.capability = options.capability;

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