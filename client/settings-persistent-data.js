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

/** @param currentStatus {import('../lib/miio/Status')} */
function initForm(currentStatus) {
    var labMode = document.getElementById("lab_mode_enabled");
    labMode.addEventListener("change", function() {
        disableResetMap(!labMode.checked);
    });

    labMode.checked = (currentStatus.lab_status === 1);
    disableResetMap(currentStatus.lab_status !== 1);
}

async function updateSettingsPersistentDataPage() {
    var loadingBarSettingsPersistentData =
        document.getElementById("loading-bar-settings-persistent-data");

    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");

    try {
        let res = await ApiService.getCapabilities();
        if (res["persistent_data"]) {
            document.getElementById("persistent_data_form").classList.remove("hidden");

            res = await ApiService.getCurrentStatus();
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
