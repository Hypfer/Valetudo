/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsWifiPage() {
    var loadingBarSettingsWifi = document.getElementById("loading-bar-settings-wifi");
    var wifiCurrentConnectionStatusConnected =
        document.getElementById("settings-wifi-current-connection-status-connected");
    var wifiCurrentConnectionStatusSSID =
        document.getElementById("settings-wifi-current-connection-status-ssid");
    var wifiCurrentConnectionStatusSignal =
        document.getElementById("settings-wifi-current-connection-status-signal");

    var wifiInputSSID = document.getElementById("settings-wifi-input-ssid");
    var wifiInputPassword = document.getElementById("settings-wifi-input-password");

    wifiInputSSID.addEventListener("input", updateWifiCredentialsSaveButton);
    wifiInputPassword.addEventListener("input", updateWifiCredentialsSaveButton);

    loadingBarSettingsWifi.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getWifiStatus();
        wifiCurrentConnectionStatusConnected.innerHTML = res.details.state;
        if (res.details.state === "connected") {
            wifiCurrentConnectionStatusSSID.innerHTML = res.ssid;
            wifiCurrentConnectionStatusSignal.innerHTML = res.details.signal;

            wifiInputSSID.value = res.ssid;
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsWifi.removeAttribute("indeterminate");
    }
}

function updateWifiCredentialsSaveButton() {
    var wifiInputSSID = document.getElementById("settings-wifi-input-ssid");
    var wifiInputPassword = document.getElementById("settings-wifi-input-password");
    var wifiInputSaveButton = document.getElementById("settings-wifi-input-save-button");

    if (wifiInputSSID.value && wifiInputSSID.value !== "" && wifiInputPassword.value &&
        wifiInputPassword.value !== "") {

        wifiInputSaveButton.removeAttribute("disabled");
    } else {
        wifiInputSaveButton.setAttribute("disabled", "disabled");
    }
}

async function handleWifiSettingsSaveButton() {
    var loadingBarSettingsWifi = document.getElementById("loading-bar-settings-wifi");
    var wifiInputSSID = document.getElementById("settings-wifi-input-ssid");
    var wifiInputPassword = document.getElementById("settings-wifi-input-password");

    let answer = await ons.notification
        .confirm("Are you sure you want to apply the new wifi settings?<br><br>" +
                 "<span style=\"font-weight: bold\">Hint:</span> You can always revert back to the " +
                 "integrated Wifi Hotspot by pressing the reset button located underneath the lid.");

    if (answer === 1) {
        loadingBarSettingsWifi.setAttribute("indeterminate", "indeterminate");
        try {
            await ApiService.saveWifiConfig(wifiInputSSID.value, wifiInputPassword.value);
            await ons.notification
                .alert(
                    "Successfully applied new wifi credentials.<br>After pressing OK the page will refresh.<br>" +
                    "However, you will most likely need to change the URL since the robot will connect to a new wifi.");
            location.reload();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            loadingBarSettingsWifi.removeAttribute("indeterminate");
        }
    }

}

window.updateSettingsWifiPage = updateSettingsWifiPage;
window.handleWifiSettingsSaveButton = handleWifiSettingsSaveButton;