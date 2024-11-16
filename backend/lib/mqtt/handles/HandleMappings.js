const capabilities = require("../../core/capabilities");
const capabilityHandles = require("../capabilities");
const stateAttrs = require("../../entities/state/attributes");
const stateHandles = require("../status");

const CAPABILITY_TYPE_TO_HANDLE_MAPPING = {
    [capabilities.BasicControlCapability.TYPE]: capabilityHandles.BasicControlCapabilityMqttHandle,
    [capabilities.ConsumableMonitoringCapability.TYPE]: capabilityHandles.ConsumableMonitoringCapabilityMqttHandle,
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityHandles.PresetSelectionCapabilityMqttHandle,
    [capabilities.GoToLocationCapability.TYPE]: capabilityHandles.GoToLocationCapabilityMqttHandle,
    [capabilities.LocateCapability.TYPE]: capabilityHandles.LocateCapabilityMqttHandle,
    [capabilities.MapSegmentationCapability.TYPE]: capabilityHandles.MapSegmentationCapabilityMqttHandle,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityHandles.PresetSelectionCapabilityMqttHandle,
    [capabilities.OperationModeControlCapability.TYPE]: capabilityHandles.PresetSelectionCapabilityMqttHandle,
    [capabilities.WifiConfigurationCapability.TYPE]: capabilityHandles.WifiConfigurationCapabilityMqttHandle,
    [capabilities.ZoneCleaningCapability.TYPE]: capabilityHandles.ZoneCleaningCapabilityMqttHandle,
    [capabilities.AutoEmptyDockManualTriggerCapability.TYPE]: capabilityHandles.AutoEmptyDockManualTriggerCapabilityMqttHandle,
    [capabilities.CurrentStatisticsCapability.TYPE]: capabilityHandles.CurrentStatisticsCapabilityMqttHandle,
    [capabilities.TotalStatisticsCapability.TYPE]: capabilityHandles.TotalStatisticsCapabilityMqttHandle,
    [capabilities.SpeakerVolumeControlCapability.TYPE]: capabilityHandles.SpeakerVolumeControlCapabilityMqttHandle,
    [capabilities.KeyLockCapability.TYPE]: capabilityHandles.KeyLockCapabilityMqttHandle,
    [capabilities.ObstacleAvoidanceControlCapability.TYPE]: capabilityHandles.ObstacleAvoidanceControlCapabilityMqttHandle,
    [capabilities.PetObstacleAvoidanceControlCapability.TYPE]: capabilityHandles.PetObstacleAvoidanceControlCapabilityMqttHandle,
    [capabilities.CarpetModeControlCapability.TYPE]: capabilityHandles.CarpetModeControlCapabilityMqttHandle,
    [capabilities.CarpetSensorModeControlCapability.TYPE]: capabilityHandles.CarpetSensorModeControlCapabilityMqttHandle,
};

const STATUS_ATTR_TO_HANDLE_MAPPING = [
    {
        matcher: {attributeClass: stateAttrs.AttachmentStateAttribute.name},
        handle: stateHandles.AttachmentStateMqttHandle
    },
    {
        matcher: {attributeClass: stateAttrs.BatteryStateAttribute.name},
        handle: stateHandles.BatteryStateMqttHandle
    },
    {
        matcher: {attributeClass: stateAttrs.StatusStateAttribute.name},
        handle: stateHandles.StatusStateMqttHandle
    },
    {
        matcher: {attributeClass: stateAttrs.DockStatusStateAttribute.name},
        handle: stateHandles.DockStatusStateMqttHandle
    }
];

module.exports = {
    CAPABILITY_TYPE_TO_HANDLE_MAPPING: CAPABILITY_TYPE_TO_HANDLE_MAPPING,
    STATUS_ATTR_TO_HANDLE_MAPPING: STATUS_ATTR_TO_HANDLE_MAPPING,
};
