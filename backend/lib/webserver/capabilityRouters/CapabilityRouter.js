const express = require("express");

const Logger = require("../../Logger");
const NotImplementedError = require("../../core/NotImplementedError");
const RobotFirmwareError = require("../../core/RobotFirmwareError");

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

    /**
     * @protected
     * @param {any} req
     * @param {any} res
     * @param {Error} err
     */
    sendErrorResponse(req, res, err) {
        if (err instanceof RobotFirmwareError) {
            Logger.warn(`${this.constructor.name}: Received error from robot while handling route "${req.path}"`, {
                body: req.body,
                message: err.message
            });
        } else {
            Logger.warn(`${this.constructor.name}: Error while handling route "${req.path}"`, {
                body: req.body,
                message: err.message
            });
        }


        res.status(500).json(err.message);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = CapabilityRouter;
