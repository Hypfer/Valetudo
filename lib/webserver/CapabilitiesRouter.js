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
     * @param {boolean} options.enableDebugCapability
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableDebugCapability = options.enableDebugCapability;
        this.router = express.Router({mergeParams: true});

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(Object.values(this.robot.capabilities).map(c => c.getType()));
        });

        Object.values(this.robot.capabilities).forEach(robotCapability => {
            // Raw commands capability must be explicitly enabled in config
            if (robotCapability.getType() === capabilities.DebugCapability.TYPE && !this.enableDebugCapability) {
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
    [capabilities.CarpetModeControlCapability.TYPE]: capabilityRouters.CarpetModeControlCapabilityRouter,
    [capabilities.CombinedVirtualRestrictionsCapability.TYPE]: capabilityRouters.CombinedVirtualRestrictionsCapabilityRouter,
    [capabilities.ConsumableMonitoringCapability.TYPE]: capabilityRouters.ConsumableMonitoringCapabilityRouter,
    [capabilities.DebugCapability.TYPE]: capabilityRouters.DebugCapabilityRouter,
    [capabilities.DoNotDisturbCapability.TYPE]: capabilityRouters.DoNotDisturbCapabilityRouter,
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityRouters.PresetSelectionCapabilityRouter,
    [capabilities.GoToLocationCapability.TYPE]: capabilityRouters.GoToLocationCapabilityRouter,
    [capabilities.LEDControlCapability.TYPE]: capabilityRouters.LEDControlCapabilityRouter,
    [capabilities.LocateCapability.TYPE]: capabilityRouters.LocateCapabilityRouter,
    [capabilities.ManualControlCapability.TYPE]: capabilityRouters.ManualControlCapabilityRouter,
    [capabilities.MapSegmentationCapability.TYPE]: capabilityRouters.MapSegmentationCapabilityRouter,
    [capabilities.MapSegmentEditCapability.TYPE]: capabilityRouters.MapSegmentEditCapabilityRouter,
    [capabilities.MapSegmentRenameCapability.TYPE]: capabilityRouters.MapSegmentRenameCapabilityRouter,
    [capabilities.MapSnapshotCapability.TYPE]: capabilityRouters.MapSnapshotCapabilityRouter,
    [capabilities.MapResetCapability.TYPE]: capabilityRouters.MapResetCapabilityRouter,
    [capabilities.MovementModeSelectionCapability.TYPE]: capabilityRouters.PresetSelectionCapabilityRouter,
    [capabilities.PersistentMapControlCapability.TYPE]: capabilityRouters.PersistentMapControlCapabilityRouter,
    [capabilities.SensorCalibrationCapability.TYPE]: capabilityRouters.SensorCalibrationCapabilityRouter,
    [capabilities.SpeakerVolumeControlCapability.TYPE]: capabilityRouters.SpeakerVolumeControlCapabilityRouter,
    [capabilities.SpeakerTestCapability.TYPE]: capabilityRouters.SpeakerTestCapabilityRouter,
    [capabilities.VoicePackManagementCapability.TYPE]: capabilityRouters.VoicePackManagementCapabilityRouter,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityRouters.PresetSelectionCapabilityRouter,
    [capabilities.WifiConfigurationCapability.TYPE]: capabilityRouters.WifiConfigurationCapabilityRouter,
    [capabilities.ZoneCleaningCapability.TYPE]: capabilityRouters.ZoneCleaningCapabilityRouter,
};

module.exports = CapabilitiesRouter;
