/*global ons, fn*/

var loadingBarSettingsPersistentData =
    document.getElementById("loading-bar-settings-persistent-data");
var labMode = /** @type {HTMLInputElement} */ (document.getElementById("lab_mode_enabled"));

ons.getScriptPage().onShow = function() {
    labMode.addEventListener("change", function() {
        disableResetMap(!labMode.checked);
    });

    updateSettingsPersistentDataPage();
};

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
    labMode.checked = (currentStatus.lab_status === 1);
    disableResetMap(currentStatus.lab_status !== 1);
}

function updateSettingsPersistentDataPage() {
    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");
    fn.request("api/capabilities", "GET", function(err, res) {
        if (err) {
            loadingBarSettingsPersistentData.removeAttribute("indeterminate");
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            if (res["persistent_data"]) {
                document.getElementById("persistent_data_form").classList.remove("hidden");

                fn.request("api/current_status", "GET", function(err, res) {
                    loadingBarSettingsPersistentData.removeAttribute("indeterminate");

                    if (err) {
                        ons.notification.toast(
                            err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                    } else {
                        initForm(res);
                    }
                });

            } else {
                loadingBarSettingsPersistentData.removeAttribute("indeterminate");
                document.getElementById("persistent_data_not_supported").classList.remove("hidden");
            }
        }
    });
}

// eslint-disable-next-line no-unused-vars
function resetMap() {
    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");
    fn.request("api/reset_map", "PUT", function(err, res) {
        loadingBarSettingsPersistentData.removeAttribute("indeterminate");
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            ons.notification.toast("Map resetted!",
                {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
        }
    });
}

// eslint-disable-next-line no-unused-vars
function savePersistentData() {
    const labStatus = true === labMode.checked;

    loadingBarSettingsPersistentData.setAttribute("indeterminate", "indeterminate");
    fn.requestWithPayload(
        "api/set_lab_status", JSON.stringify({lab_status: labStatus}), "PUT", function(err, res) {
            loadingBarSettingsPersistentData.removeAttribute("indeterminate");
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } else {
                ons.notification.toast("Saved settings!",
                    {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
            }
        });
}
