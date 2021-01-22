/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsCarpetModePage() {
    var loadingBarSettingsCarpetMode = document.getElementById("loading-bar-settings-carpet-mode");

    loadingBarSettingsCarpetMode.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getCarpetMode();
        var carpetForm = document.getElementById("carpet-mode-form");
        carpetForm.current_low.value = res.current_low;
        carpetForm.current_high.value = res.current_high;
        carpetForm.current_integral.value = res.current_integral;
        carpetForm.stall_time.value = res.stall_time;
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
        var carpetForm = document.getElementById("carpet-mode-form");
        var current_low = parseInt(carpetForm.current_low.value);
        var current_high = parseInt(carpetForm.current_high.value);
        var current_integral = parseInt(carpetForm.current_integral.value);
        var stall_time = parseInt(carpetForm.stall_time.value);
        var enabled = document.getElementById("carpet_mode_enabled").checked;

        try {
            await ApiService.setCarpetMode(enabled, stall_time, current_low, current_high, current_integral);
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