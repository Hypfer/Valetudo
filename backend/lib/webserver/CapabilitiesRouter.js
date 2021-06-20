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
     * @param {*} options.validator
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableDebugCapability = options.enableDebugCapability;
        this.router = express.Router({mergeParams: true});

        this.validator = options.validator;

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
                    new matchedRouter({capability: robotCapability, validator: this.validator}).getRouter()
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
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityRouters.PresetSelectionCapabilityRouter,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityRouters.PresetSelectionCapabilityRouter,
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
    [capabilities.DebugCapability.TYPE]: capabilityRouters.DebugCapabilityRouter,
    [capabilities.MapSegmentationCapability.TYPE]: capabilityRouters.MapSegmentationCapabilityRouter,
    [capabilities.DoNotDisturbCapability.TYPE]: capabilityRouters.DoNotDisturbCapabilityRouter,
    [capabilities.CarpetModeControlCapability.TYPE]: capabilityRouters.CarpetModeControlCapabilityRouter,
    [capabilities.SpeakerTestCapability.TYPE]: capabilityRouters.SpeakerTestCapabilityRouter,
    [capabilities.VoicePackManagementCapability.TYPE]: capabilityRouters.VoicePackManagementCapabilityRouter,
    [capabilities.MapSegmentEditCapability.TYPE]: capabilityRouters.MapSegmentEditCapabilityRouter,
    [capabilities.MapResetCapability.TYPE]: capabilityRouters.MapResetCapabilityRouter,
    [capabilities.MapSegmentRenameCapability.TYPE]: capabilityRouters.MapSegmentRenameCapabilityRouter
};

module.exports = CapabilitiesRouter;
