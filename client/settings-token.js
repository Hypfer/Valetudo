
var loadingBarSettingsToken = document.getElementById("loading-bar-settings-token");
var settingsTokenLabel = {
    local: document.getElementById("settings-token-label"),
    cloud: document.getElementById("settings-cloud-token-label")
};

ons.getScriptPage().onShow = function() {
    updateSettingsTokenPage();
};

function updateSettingsTokenPage() {
    loadingBarSettingsToken.setAttribute("indeterminate", "indeterminate");
    fn.request("api/token", "GET", function(err, res) {
        loadingBarSettingsToken.removeAttribute("indeterminate");
        if (!err) {
            settingsTokenLabel.cloud.innerHTML = res.cloud;
            settingsTokenLabel.local.innerHTML = res.local;
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}
