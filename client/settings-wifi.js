
var loadingBarSettingsWifi = document.getElementById("loading-bar-settings-wifi");
var wifiCurrentConnectionStatusConnected =
    document.getElementById("settings-wifi-current-connection-status-connected");
var wifiCurrentConnectionStatusSSID =
    document.getElementById("settings-wifi-current-connection-status-ssid");
var wifiCurrentConnectionStatusSignal =
    document.getElementById("settings-wifi-current-connection-status-signal");
var wifiCurrentConnectionStatusTXBitrate =
    document.getElementById("settings-wifi-current-connection-status-tx-bitrate");

var wifiInputSSID = document.getElementById("settings-wifi-input-ssid");
var wifiInputPassword = document.getElementById("settings-wifi-input-password");
var wifiInputSaveButton = document.getElementById("settings-wifi-input-save-button");

wifiInputSSID.addEventListener("input", updateWifiCredentialsSaveButton);
wifiInputPassword.addEventListener("input", updateWifiCredentialsSaveButton);

ons.getScriptPage().onShow = function() {
    updateSettingsWifiPage();
};

function updateSettingsWifiPage() {
    loadingBarSettingsWifi.setAttribute("indeterminate", "indeterminate");
    fn.request("api/wifi_status", "GET", function(err, res) {
        loadingBarSettingsWifi.removeAttribute("indeterminate");
        if (!err) {
            wifiCurrentConnectionStatusConnected.innerHTML =
                res.connected === true ? "Connected" : "Not connected";
            if (res.connected) {
                wifiCurrentConnectionStatusSSID.innerHTML = res.connection_info.ssid;
                wifiCurrentConnectionStatusSignal.innerHTML = res.connection_info.signal;
                wifiCurrentConnectionStatusTXBitrate.innerHTML = res.connection_info.tx_bitrate;

                wifiInputSSID.value = res.connection_info.ssid;
            }
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

function updateWifiCredentialsSaveButton() {
    if (wifiInputSSID.value && wifiInputSSID.value !== "" && wifiInputPassword.value &&
        wifiInputPassword.value !== "") {

        wifiInputSaveButton.removeAttribute("disabled");
    } else {
        wifiInputSaveButton.setAttribute("disabled", "disabled");
    }
}

function handleWifiSettingsSaveButton() {
    ons.notification
        .confirm("Are you sure you want to apply the new wifi settings?<br><br>" +
                 "<span style=\"font-weight: bold\">Hint:</span> You can always revert back to the " +
                 "integrated Wifi Hotspot by pressing the reset button located underneath the lid.")
        .then(function(answer) {
            if (answer === 1) {
                loadingBarSettingsWifi.setAttribute("indeterminate", "indeterminate");

                fn.requestWithPayload(
                    "api/wifi_configuration",
                    JSON.stringify({ssid: wifiInputSSID.value, password: wifiInputPassword.value}),
                    "PUT", function(err) {
                        if (err) {
                            loadingBarSettingsWifi.removeAttribute("indeterminate");
                            ons.notification.toast(
                                err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                        } else {
                            ons.notification
                                .alert(
                                    "Successfully applied new wifi credentials.<br>After pressing OK the page will refresh.<br>" +
                                    "However, you will most likely need to change the URL since the robot will connect to a new wifi.")
                                .then(function() {
                                    location.reload();
                                });
                        }
                    });
            }
        });
}
