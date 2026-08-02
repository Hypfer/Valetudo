const express = require("express");
const RateLimit = require("express-rate-limit");

const DuststreamingCapability = require("../core/capabilities/DuststreamingCapability");

class KillswitchRouter {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});
        this.robot = options.robot;

        this.limiter = RateLimit.rateLimit({
            windowMs: 60 * 1000,
            max: 5,
            keyGenerator: () => "global"
        });

        this.initRoutes();
    }


    initRoutes() {
        const capability = this.robot.capabilities[DuststreamingCapability.TYPE];
        if (capability) {
            this.router.get("/camera", this.limiter, async (req, res) => {
                try {
                    await capability.selfDestruct();
                } catch (e) {
                    // whatever
                }

                res.sendStatus(200);
            });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = KillswitchRouter;
