/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsCarpetModePage() {
    var loadingBarSettingsCarpetMode = document.getElementById("loading-bar-settings-carpet-mode");

    loadingBarSettingsCarpetMode.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getCarpetMode();
        var carpetForm = document.getElementById("carpet-mode-form");
        var result = res[0];
        carpetForm.current_low.value = result.current_low;
        carpetForm.current_high.value = result.current_high;
        carpetForm.current_integral.value = result.current_integral;
        carpetForm.stall_time.value = result.stall_time;
        document.getElementById("carpet_mode_enabled").checked = (result.enable === 1);
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
        var current_low = carpetForm.current_low.value;
        var current_high = carpetForm.current_high.value;
        var current_integral = carpetForm.current_integral.value;
        var stall_time = carpetForm.stall_time.value;
        var enable = (document.getElementById("carpet_mode_enabled").checked === true);

        try {
            await ApiService.setCarpetMode(enable, current_low, current_high, current_integral, stall_time);
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