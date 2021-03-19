/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsCarpetModePage() {
    var loadingBarSettingsCarpetMode = document.getElementById("loading-bar-settings-carpet-mode");

    loadingBarSettingsCarpetMode.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getCarpetModeStatus();
        document.getElementById("carpet_mode_enabled").checked = res.enabled;
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsCarpetMode.removeAttribute("indeterminate");
    }
}

async function saveCarpetMode() {
    var loadingBarSettingsCarpetMode = document.getElementById("loading-bar-settings-carpet-mode");

    let answer = await ons.notification
        .confirm("Do you really want to save the modifications made in the carpet mode?");

    if (answer === 1) {
        loadingBarSettingsCarpetMode.setAttribute("indeterminate", "indeterminate");
        var enabled = document.getElementById("carpet_mode_enabled").checked;

        try {
            if (enabled) {
                await ApiService.enableCarpetMode();
            } else {
                await ApiService.disableCarpetMode();
            }

            updateSettingsCarpetModePage();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            loadingBarSettingsCarpetMode.removeAttribute("indeterminate");
        }
    }
}

window.updateSettingsCarpetModePage = updateSettingsCarpetModePage;
window.saveCarpetMode = saveCarpetMode;
