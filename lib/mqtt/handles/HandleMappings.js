const capabilities = require("../../core/capabilities");
const capabilityHandles = require("../capabilities");
const stateAttrs = require("../../entities/state/attributes");
const stateHandles = require("../status");

const CAPABILITY_TYPE_TO_HANDLE_MAPPING = {
    [capabilities.BasicControlCapability.TYPE]: capabilityHandles.BasicControlCapabilityMqttHandle,
    [capabilities.ConsumableMonitoringCapability.TYPE]: capabilityHandles.ConsumableMonitoringCapabilityMqttHandle,
    [capabilities.FanSpeedControlCapability.TYPE]: capabilityHandles.IntensityPresetCapabilityMqttHandle,
    [capabilities.LocateCapability.TYPE]: capabilityHandles.LocateCapabilityMqttHandle,
    [capabilities.WaterUsageControlCapability.TYPE]: capabilityHandles.IntensityPresetCapabilityMqttHandle,
    [capabilities.WifiConfigurationCapability.TYPE]: capabilityHandles.WifiConfigurationCapabilityMqttHandle,
    [capabilities.ZoneCleaningCapability.TYPE]: capabilityHandles.ZoneCleaningCapabilityMqttHandle,
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
    }
];

module.exports = {
    CAPABILITY_TYPE_TO_HANDLE_MAPPING: CAPABILITY_TYPE_TO_HANDLE_MAPPING,
    STATUS_ATTR_TO_HANDLE_MAPPING: STATUS_ATTR_TO_HANDLE_MAPPING,
};
