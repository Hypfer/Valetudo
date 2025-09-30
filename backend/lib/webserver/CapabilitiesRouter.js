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
     * @param {*} options.validator
     */
    constructor(options) {
        this.robot = options.robot;
        this.router = express.Router({mergeParams: true});

        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(Object.values(this.robot.capabilities).map(c => {
                return c.getType();
            }));
        });

        Object.values(this.robot.capabilities).forEach(robotCapability => {
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
    [capabilities.OperationModeControlCapability.TYPE]: capabilityRouters.PresetSelectionCapabilityRouter,
    [capabilities.ConsumableMonitoringCapability.TYPE]: capabilityRouters.ConsumableMonitoringCapabilityRouter,
    [capabilities.ZoneCleaningCapability.TYPE]: capabilityRouters.ZoneCleaningCapabilityRouter,
    [capabilities.GoToLocationCapability.TYPE]: capabilityRouters.GoToLocationCapabilityRouter,
    [capabilities.WifiConfigurationCapability.TYPE]: capabilityRouters.WifiConfigurationCapabilityRouter,
    [capabilities.MapSnapshotCapability.TYPE]: capabilityRouters.MapSnapshotCapabilityRouter,
    [capabilities.LocateCapability.TYPE]: capabilityRouters.LocateCapabilityRouter,
    [capabilities.ManualControlCapability.TYPE]: capabilityRouters.ManualControlCapabilityRouter,
    [capabilities.CombinedVirtualRestrictionsCapability.TYPE]: capabilityRouters.CombinedVirtualRestrictionsCapabilityRouter,
    [capabilities.PersistentMapControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.SpeakerVolumeControlCapability.TYPE]: capabilityRouters.SpeakerVolumeControlCapabilityRouter,
    [capabilities.MapSegmentationCapability.TYPE]: capabilityRouters.MapSegmentationCapabilityRouter,
    [capabilities.DoNotDisturbCapability.TYPE]: capabilityRouters.DoNotDisturbCapabilityRouter,
    [capabilities.CarpetModeControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.SpeakerTestCapability.TYPE]: capabilityRouters.SpeakerTestCapabilityRouter,
    [capabilities.VoicePackManagementCapability.TYPE]: capabilityRouters.VoicePackManagementCapabilityRouter,
    [capabilities.MapSegmentEditCapability.TYPE]: capabilityRouters.MapSegmentEditCapabilityRouter,
    [capabilities.MapResetCapability.TYPE]: capabilityRouters.MapResetCapabilityRouter,
    [capabilities.MapSegmentRenameCapability.TYPE]: capabilityRouters.MapSegmentRenameCapabilityRouter,
    [capabilities.PendingMapChangeHandlingCapability.TYPE]: capabilityRouters.PendingMapChangeHandlingCapabilityRouter,
    [capabilities.MappingPassCapability.TYPE]: capabilityRouters.MappingPassCapabilityRouter,
    [capabilities.KeyLockCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.ObstacleAvoidanceControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.PetObstacleAvoidanceControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.AutoEmptyDockManualTriggerCapability.TYPE]: capabilityRouters.AutoEmptyDockManualTriggerCapabilityRouter,
    [capabilities.TotalStatisticsCapability.TYPE]: capabilityRouters.StatisticsCapabilityRouter,
    [capabilities.CurrentStatisticsCapability.TYPE]: capabilityRouters.StatisticsCapabilityRouter,
    [capabilities.QuirksCapability.TYPE]: capabilityRouters.QuirksCapabilityRouter,
    [capabilities.WifiScanCapability.TYPE]: capabilityRouters.WifiScanCapabilityRouter,
    [capabilities.MopDockCleanManualTriggerCapability.TYPE]: capabilityRouters.MopDockCleanManualTriggerCapabilityRouter,
    [capabilities.MopDockDryManualTriggerCapability.TYPE]: capabilityRouters.MopDockDryManualTriggerCapabilityRouter,
    [capabilities.CollisionAvoidantNavigationControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.CarpetSensorModeControlCapability.TYPE]: capabilityRouters.CarpetSensorModeControlCapabilityRouter,
    [capabilities.AutoEmptyDockAutoEmptyIntervalControlCapability.TYPE]: capabilityRouters.AutoEmptyDockAutoEmptyIntervalControlCapabilityRouter,
    [capabilities.ObstacleImagesCapability.TYPE]: capabilityRouters.ObstacleImagesCapabilityRouter,
    [capabilities.HighResolutionManualControlCapability.TYPE]: capabilityRouters.HighResolutionManualControlCapabilityRouter,
    [capabilities.MopExtensionControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.CameraLightControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.MopDockMopWashTemperatureControlCapability.TYPE]: capabilityRouters.MopDockMopWashTemperatureControlCapabilityRouter,
    [capabilities.MopTwistControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.MopExtensionFurnitureLegHandlingControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
    [capabilities.MopDockMopAutoDryingControlCapability.TYPE]: capabilityRouters.SimpleToggleCapabilityRouter,
};

module.exports = CapabilitiesRouter;
