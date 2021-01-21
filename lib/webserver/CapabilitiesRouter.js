const express = require("express");

const capabilities = require("../core/capabilities");
const capabilityRouters = require("./capabilityRouters");

const Logger = require("../Logger");

class CapabilitiesRouter {
    /**
     * Takes a ValetudoRobot and creates routers for each capability it features
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {boolean} options.enableRawCommandCapability
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableRawCommandCapability = options.enableRawCommandCapability;
        this.router = express.Router({mergeParams: true});

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(Object.values(this.robot.capabilities).map(c => c.getType()));
        });

        Object.values(this.robot.capabilities).forEach(robotCapability => {
            // Raw commands capability must be explicitly enabled in config
            if (robotCapability.getType() === capabilities.RawCommandCapability.TYPE && !this.enableRawCommandCapability) {
                return;
            }
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
    [capabilities.BasicControlCapability.TYPE]: capabilityRouters.BasicControlCapabilityRouter,
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityRouters.IntensityPresetCapabilityRouter,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityRouters.IntensityPresetCapabilityRouter,
    [capabilities.CarpetTurboControlCapability.TYPE]: capabilityRouters.IntensityPresetCapabilityRouter,
    [capabilities.LEDControlCapability.TYPE]: capabilityRouters.LEDControlCapabilityRouter,
    [capabilities.ConsumableMonitoringCapability.TYPE]: capabilityRouters.ConsumableMonitoringCapabilityRouter,
    [capabilities.ZoneCleaningCapability.TYPE]: capabilityRouters.ZoneCleaningCapabilityRouter,
    [capabilities.GoToLocationCapability.TYPE]: capabilityRouters.GoToLocationCapabilityRouter,
    [capabilities.WifiConfigurationCapability.TYPE]: capabilityRouters.WifiConfigurationCapabilityRouter,
    [capabilities.MapSnapshotCapability.TYPE]: capabilityRouters.MapSnapshotCapabilityRouter,
    [capabilities.LocateCapability.TYPE]: capabilityRouters.LocateCapabilityRouter,
    [capabilities.ManualControlCapability.TYPE]: capabilityRouters.ManualControlCapabilityRouter,
    [capabilities.CombinedVirtualRestrictionsCapability.TYPE]: capabilityRouters.CombinedVirtualRestrictionsCapabilityRouter,
    [capabilities.PersistentMapControlCapability.TYPE]: capabilityRouters.PersistentMapControlCapabilityRouter,
    [capabilities.SensorCalibrationCapability.TYPE]: capabilityRouters.SensorCalibrationCapabilityRouter,
    [capabilities.SpeakerVolumeControlCapability.TYPE]: capabilityRouters.SpeakerVolumeControlCapabilityRouter,
    [capabilities.RawCommandCapability.TYPE]: capabilityRouters.RawCommandCapabilityRouter,
    [capabilities.MapSegmentationCapability.TYPE]: capabilityRouters.MapSegmentationCapabilityRouter,
    [capabilities.DoNotDisturbCapability.TYPE]: capabilityRouters.DoNotDisturbCapabilityRouter
};

module.exports = CapabilitiesRouter;
