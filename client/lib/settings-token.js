/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsTokenPage() {
    var loadingBarSettingsToken = document.getElementById("loading-bar-settings-token");
    var settingsTokenLabel = {
        local: document.getElementById("settings-token-label"),
        cloud: document.getElementById("settings-cloud-token-label")
    };

    loadingBarSettingsToken.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getToken();
        settingsTokenLabel.cloud.innerHTML = res.cloud;
        settingsTokenLabel.local.innerHTML = res.local;
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsToken.removeAttribute("indeterminate");
    }
}

window.updateSettingsTokenPage = updateSettingsTokenPage;
