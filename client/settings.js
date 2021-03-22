/*global ons */
import {ApiService} from "./services/api.service.js";

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
