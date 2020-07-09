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

function initForm(vacuumState) {
    var labMode = document.getElementById("lab_mode_enabled");
    labMode.addEventListener("change", function() {
        disableResetMap(!labMode.checked);
    });

    var PersistentMapSettingStateAttribute = vacuumState.find(e => e.__class === "PersistentMapSettingStateAttribute");

    labMode.checked = (PersistentMapSettingStateAttribute && PersistentMapSettingStateAttribute.value === "enabled");
    disableResetMap(!PersistentMapSettingStateAttribute || (PersistentMapSettingStateAttribute && PersistentMapSettingStateAttribute.value !== "enabled"));
}

async function updateSettingsPersistentDataPage() {
    var loadingBarSettingsPersistentData =
        document.getElementById("loading-bar-settings-persistent-data");

    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");

    try {
        let res = await ApiService.getCapabilities();
        if (res["persistent_data"]) {
            document.getElementById("persistent_data_form").classList.remove("hidden");

            res = await ApiService.getVacuumState();
            initForm(res);
        } else {
            loadingBarSettingsPersistentData.removeAttribute("indeterminate");
            document.getElementById("persistent_data_not_supported").classList.remove("hidden");
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
        await ApiService.resetMap();
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
        await ApiService.setLabStatus(labStatus);
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
