/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsAccessControlPage() {
    var loadingBarSettingsAccessControl = document.getElementById("loading-bar-settings-access-control");
    var sshKeysTextArea = document.getElementById("settings-access-control-ssh-keys-textarea");
    var httpAuthInputEnabled =
        document.getElementById("settings-access-control-http-auth-input-enabled");
    var httpAuthInputUsername =
        document.getElementById("settings-access-control-http-auth-input-username");
    var httpAuthInputPassword =
        document.getElementById("settings-access-control-http-auth-input-password");

    var sshKeysTitle = document.getElementById("settings-access-control-ssh-keys-title");
    var sshKeysList = document.getElementById("settings-access-control-ssh-keys-list");

    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getHttpAuthConfig();
        httpAuthInputEnabled.checked = res.enabled;
        httpAuthInputUsername.value = res.username;
        httpAuthInputPassword.value = "";

        try {
            res = await ApiService.getSshKeys();
            sshKeysTextArea.value = res;
            sshKeysTitle.style.display = "block";
            sshKeysList.style.display = "block";
        } catch (error) {
            // ignore error (SSH Keys disabled)
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsAccessControl.removeAttribute("indeterminate");
    }
}

async function handleSSHKeysSettingsSaveButton() {
    var loadingBarSettingsAccessControl = document.getElementById("loading-bar-settings-access-control");
    var sshKeysTextArea = document.getElementById("settings-access-control-ssh-keys-textarea");

    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.setSshKeys(sshKeysTextArea.value);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsAccessControl.removeAttribute("indeterminate");
    }
}

async function handleSSHKeysSettingsPermanentlyDisableButton() {
    var loadingBarSettingsAccessControl = document.getElementById("loading-bar-settings-access-control");
    var sshKeysTitle = document.getElementById("settings-access-control-ssh-keys-title");
    var sshKeysList = document.getElementById("settings-access-control-ssh-keys-list");
    var sshKeysInputDisableConfirmation =
        document.getElementById("settings-access-control-ssh-keys-input-disable-confirmation");

    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.disableSshKeyUpload(sshKeysInputDisableConfirmation.value);
        sshKeysTitle.style.display = "none";
        sshKeysList.style.display = "none";
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

    if (httpAuthInputPassword.value !== httpAuthInputPasswordConfirm.value)
        return ons.notification.toast(
            "Passwords don't match",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});

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
window.handleSSHKeysSettingsSaveButton = handleSSHKeysSettingsSaveButton;
window.handleSSHKeysSettingsPermanentlyDisableButton = handleSSHKeysSettingsPermanentlyDisableButton;
window.handleHttpAuthSettingsSaveButton = handleHttpAuthSettingsSaveButton;
