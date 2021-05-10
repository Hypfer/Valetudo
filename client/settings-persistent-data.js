/*global ons */
import {ApiService} from "./services/api.service.js";

function disableResetMap(flag) {
    const resetMapButton = document.getElementById("reset_map_button");
    if (flag) {
        resetMapButton.setAttribute("disabled", "true");
    } else {
        resetMapButton.removeAttribute("disabled");
    }
}

async function initForm() {
    var labMode = document.getElementById("lab_mode_enabled");
    labMode.addEventListener("change", function() {
        disableResetMap(!labMode.checked);
    });

    const res = await ApiService.getPersistentMapCapabilityStatus();

    labMode.checked = (res && res.enabled === true);
    disableResetMap(!labMode.checked);
}

async function updateSettingsPersistentDataPage() {
    var loadingBarSettingsPersistentData = document.getElementById("loading-bar-settings-persistent-data");

    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");

    try {
        let persistentMapEnabled = false;
        const capabilities = await ApiService.getCapabilities();
        const state = await ApiService.getVacuumState();
        if (state) {
            const PersistentMapSettingStateAttribute = state.find(e => e.__class === "PersistentMapSettingStateAttribute");

            if (PersistentMapSettingStateAttribute) {
                persistentMapEnabled = PersistentMapSettingStateAttribute.value === "enabled";
            }
        }

        if (Array.isArray(capabilities) && capabilities.includes("PersistentMapControlCapability")) {
            document.getElementById("persistent_data_control_form").classList.remove("hidden");

            await initForm();
        } else {
            loadingBarSettingsPersistentData.removeAttribute("indeterminate");

            if (persistentMapEnabled === true) {
                document.getElementById("persistent_data_supported").classList.remove("hidden");
            } else {
                document.getElementById("persistent_data_not_supported").classList.remove("hidden");
            }
        }
        if (persistentMapEnabled === true && Array.isArray(capabilities) && capabilities.includes("MapResetCapability")) {
            document.getElementById("reset_map_row").classList.remove("hidden");
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsPersistentData.removeAttribute("indeterminate");
    }
}

async function resetMap() {
    var loadingBarSettingsPersistentData =
        document.getElementById("loading-bar-settings-persistent-data");

    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.resetPersistentMaps();
        ons.notification.toast("Map resetted!",
            {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsPersistentData.removeAttribute("indeterminate");
    }
}

async function savePersistentData() {
    var loadingBarSettingsPersistentData =
        document.getElementById("loading-bar-settings-persistent-data");

    var labMode = document.getElementById("lab_mode_enabled");
    const labStatus = true === labMode.checked;

    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");
    try {
        if (labStatus === true) {
            await ApiService.enablePersistentMaps();
        } else {
            await ApiService.disablePersistentMaps();
        }

        ons.notification.toast("Saved settings!",
            {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsPersistentData.removeAttribute("indeterminate");
    }
}

window.updateSettingsPersistentDataPage = updateSettingsPersistentDataPage;
window.disableResetMap = disableResetMap;
window.resetMap = resetMap;
window.savePersistentData = savePersistentData;
