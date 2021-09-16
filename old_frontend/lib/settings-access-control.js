/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsAccessControlPage() {
    var loadingBarSettingsAccessControl = document.getElementById("loading-bar-settings-access-control");
    var httpAuthInputEnabled =
        document.getElementById("settings-access-control-http-auth-input-enabled");
    var httpAuthInputUsername =
        document.getElementById("settings-access-control-http-auth-input-username");
    var httpAuthInputPassword =
        document.getElementById("settings-access-control-http-auth-input-password");

    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getHttpAuthConfig();
        httpAuthInputEnabled.checked = res.enabled;
        httpAuthInputUsername.value = res.username;
        httpAuthInputPassword.value = "";
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsAccessControl.removeAttribute("indeterminate");
    }
}

async function handleHttpAuthSettingsSaveButton() {
    var loadingBarSettingsAccessControl = document.getElementById("loading-bar-settings-access-control");
    var httpAuthInputEnabled =
        document.getElementById("settings-access-control-http-auth-input-enabled");
    var httpAuthInputUsername =
        document.getElementById("settings-access-control-http-auth-input-username");
    var httpAuthInputPassword =
        document.getElementById("settings-access-control-http-auth-input-password");
    var httpAuthInputPasswordConfirm =
        document.getElementById("settings-access-control-http-auth-input-password-confirm");

    if (httpAuthInputPassword.value !== httpAuthInputPasswordConfirm.value) {
        return ons.notification.toast(
            "Passwords don't match",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }

    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.saveHttpAuthConfig({
            enabled: httpAuthInputEnabled.checked === true,
            username: httpAuthInputUsername.value,
            password: httpAuthInputPassword.value,
        });
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsAccessControl.removeAttribute("indeterminate");
    }
}

window.updateSettingsAccessControlPage = updateSettingsAccessControlPage;
window.handleHttpAuthSettingsSaveButton = handleHttpAuthSettingsSaveButton;
