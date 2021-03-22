/*global ons */
import {ApiService} from "./services/api.service.js";
/*
    BasicControlCapability: require("./BasicControlCapability"),
    CarpetModeControlCapability: require("./CarpetModeControlCapability"),
    CombinedVirtualRestrictionsCapability: require("./CombinedVirtualRestrictionsCapability"),
    ConsumableMonitoringCapability: require("./ConsumableMonitoringCapability"),
    DoNotDisturbCapability: require("./DoNotDisturbCapability"),
    FanSpeedControlCapability: require("./FanSpeedControlCapability"),
    GoToLocationCapability: require("./GoToLocationCapability"),
    IntensityPresetCapability: require("./IntensityPresetCapability"),
    LEDControlCapability: require("./LEDControlCapability"),
    LocateCapability: require("./LocateCapability"),
    ManualControlCapability: require("./ManualControlCapability"),
    MapResetCapability: require("./MapResetCapability"),
    MapSegmentEditCapability: require("./MapSegmentEditCapability"),
    MapSegmentationCapability: require("./MapSegmentationCapability"),
    MapSnapshotCapability: require("./MapSnapshotCapability"),
    PersistentMapControlCapability: require("./PersistentMapControlCapability"),
    RawCommandCapability: require("./RawCommandCapability"),
    SensorCalibrationCapability: require("./SensorCalibrationCapability"),
    SpeakerTestCapability: require("./SpeakerTestCapability"),
    SpeakerVolumeControlCapability: require("./SpeakerVolumeControlCapability"),
    VoicePackManagementCapability: require("./VoicePackManagementCapability"),
    WaterUsageControlCapability: require("./WaterUsageControlCapability"),
    WifiConfigurationCapability: require("./WifiConfigurationCapability"),
    ZoneCleaningCapability: require("./ZoneCleaningCapability")
*/

async function updateSettingsPage() {
    try {
        const robotCapabilities = await ApiService.getCapabilities() || [];
        const buttonStateMap = {
            info: true,
            timers: robotCapabilities.includes("DoNotDisturbCapability"),
            "carpet-mode": robotCapabilities.includes("CarpetModeControlCapability"),
            "cleaning-history": false, // commented out in settings.html?
            "persistent-data": robotCapabilities.includes("PersistentMapControlCapability"),
            consumables: robotCapabilities.includes("ConsumableMonitoringCapability"),
            wifi: robotCapabilities.includes("WifiConfigurationCapability"),
            mqtt: robotCapabilities.includes("WifiConfigurationCapability"),
            token: false, // commented out in settings.html?
            sound: robotCapabilities.includes("SpeakerVolumeControlCapability"),
            "access-control": robotCapabilities.includes("WifiConfigurationCapability")
        };

        Object.keys(buttonStateMap).forEach((key) => {
            const state = buttonStateMap[key];
            console.log('element ', key)
            console.log('show', state);
            const element = document.getElementById(`settings-${key}`);

            if (element && !state) {
                element.style = "display: none;";
            }

        });
    } catch (err) {
        ons.notification.toast(`Error: ${err.message}`,
            { buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout });
    }
}


window.updateSettingsPage = updateSettingsPage;
