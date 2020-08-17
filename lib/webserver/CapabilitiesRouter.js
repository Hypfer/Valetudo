const express = require("express");

const capabilites = require("../core/capabilities");
const capabilityRouters = require("./capabilityRouters");

const Logger = require("../Logger");

class CapabilitiesRouter {
    /**
     * Takes a ValetudoRobot and creates routers for each capability it features
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
        this.router = express.Router({mergeParams: true});

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(Object.values(this.robot.capabilities).map(c => c.getType()));
        });

        Object.values(this.robot.capabilities).forEach(robotCapability => {
            const matchedRouter = CAPABILITY_TYPE_TO_ROUTER_MAPPING[robotCapability.getType()];

            if (matchedRouter) {
                this.router.use(
                    "/" + robotCapability.getType(),
                    new matchedRouter({capability: robotCapability}).getRouter()
                );

            } else {
                Logger.info("No matching CapabilityRouter for " + robotCapability.getType());
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

const CAPABILITY_TYPE_TO_ROUTER_MAPPING = {
    [capabilites.BasicControlCapability.TYPE]: capabilityRouters.BasicControlCapabilityRouter,
    [capabilites.FanSpeedControlCapability.TYPE]: capabilityRouters.FanSpeedControlCapabilityRouter,
    [capabilites.ConsumableMonitoringCapability.TYPE]: capabilityRouters.ConsumableMonitoringCapabilityRouter,
    [capabilites.ZoneCleaningCapability.TYPE]: capabilityRouters.ZoneCleaningCapabilityRouter,
    [capabilites.GoToLocationCapability.TYPE]: capabilityRouters.GoToLocationCapabilityRouter,
    [capabilites.WifiConfigurationCapability.TYPE]: capabilityRouters.WifiConfigurationCapabilityRouter,
    [capabilites.MapSnapshotCapability.TYPE]: capabilityRouters.MapSnapshotCapabilityRouter,
    [capabilites.LocateCapability.TYPE]: capabilityRouters.LocateCapabilityRouter,
    [capabilites.CombinedVirtualRestrictionsCapability.TYPE]: capabilityRouters.CombinedVirtualRestrictionsCapabilityRouter
};

module.exports = CapabilitiesRouter;