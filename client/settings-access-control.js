/*eslint-env browser*/
/*global ons, fn*/
var loadingBarSettingsAccessControl =
    document.getElementById("loading-bar-settings-access-control");
var sshKeysTextArea = document.getElementById("settings-access-control-ssh-keys-textarea");
var sshKeysInputDisableConfirmation =
    document.getElementById("settings-access-control-ssh-keys-input-disable-confirmation");
var httpAuthInputEnabled =
    document.getElementById("settings-access-control-http-auth-input-enabled");
var httpAuthInputUsername =
    document.getElementById("settings-access-control-http-auth-input-username");
var httpAuthInputPassword =
    document.getElementById("settings-access-control-http-auth-input-password");
var httpAuthInputPasswordConfirm =
    document.getElementById("settings-access-control-http-auth-input-password-confirm");

var sshKeysTitle = document.getElementById("settings-access-control-ssh-keys-title");
var sshKeysList = document.getElementById("settings-access-control-ssh-keys-list");

ons.getScriptPage().onShow = function() {
    updateSettingsAccessControlPage();
};

function updateSettingsAccessControlPage() {
    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");
    fn.request("api/http_auth_config", "GET", function(err, res) {
        if (!err) {
            httpAuthInputEnabled.checked = res.enabled;
            httpAuthInputUsername.value = res.username;
            httpAuthInputPassword.value = "";
            fn.request("api/get_ssh_keys", "GET", function(err, res) {
                if (!err) {
                    sshKeysTextArea.value = res;

                    sshKeysTitle.style.display = "block";
                    sshKeysList.style.display = "block";
                }
                loadingBarSettingsAccessControl.removeAttribute("indeterminate");
            });
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

// eslint-disable-next-line no-unused-vars
function handleSSHKeysSettingsSaveButton() {
    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");

    fn.requestWithPayload(
        "api/set_ssh_keys", JSON.stringify({keys: sshKeysTextArea.value}), "PUT", function(err) {
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            }
            loadingBarSettingsAccessControl.removeAttribute("indeterminate");
        });
}

// eslint-disable-next-line no-unused-vars
function handleSSHKeysSettingsPermanentlyDisableButton() {
    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");

    fn.requestWithPayload(
        "api/ssh_keys_permanently_disable",
        JSON.stringify({confirmation: sshKeysInputDisableConfirmation.value}), "PUT",
        function(err) {
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } else {
                sshKeysTitle.style.display = "none";
                sshKeysList.style.display = "none";
            }
            loadingBarSettingsAccessControl.removeAttribute("indeterminate");
        });
}

// eslint-disable-next-line no-unused-vars
function handleHttpAuthSettingsSaveButton() {
    loadingBarSettingsAccessControl.setAttribute("indeterminate", "indeterminate");

    if (httpAuthInputPassword.value !== httpAuthInputPasswordConfirm.value)
        return ons.notification.toast(
            "Passwords don't match",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});

    fn.requestWithPayload(
        "api/http_auth_config", JSON.stringify({
            enabled: httpAuthInputEnabled.checked === true,
            username: httpAuthInputUsername.value,
            password: httpAuthInputPassword.value,
        }),
        "PUT", function(err) {
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            }
            loadingBarSettingsAccessControl.removeAttribute("indeterminate");
        });
}
