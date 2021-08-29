/*global ons, fn*/
import {ApiService} from "./services/api.service.js";

async function updateSettingsMqttPage() {
    var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");
    var mqttInputEnabled = document.getElementById("settings-mqtt-input-enabled");
    var mqttInputServer = document.getElementById("settings-mqtt-input-server");
    var mqttInputPort = document.getElementById("settings-mqtt-input-port");
    var mqttInputUsername = document.getElementById("settings-mqtt-input-username");
    var mqttInputPassword = document.getElementById("settings-mqtt-input-password");
    var mqttInputCa = document.getElementById("settings-mqtt-input-ca");
    var mqttInputClientCert = document.getElementById("settings-mqtt-input-client-cert");
    var mqttInputClientKey = document.getElementById("settings-mqtt-input-client-key");

    var mqttInputFriendlyName = document.getElementById("settings-mqtt-input-friendly-name");
    var mqttInputIdentifier = document.getElementById("settings-mqtt-input-identifier");
    var mqttInputProvideMapData = document.getElementById("settings-mqtt-input-provide-map-data");

    var mqttInputHomieEnabled = document.getElementById("settings-mqtt-input-homie-enabled");
    var mqttInputHomieAddICBINVProp = document.getElementById("settings-mqtt-input-homie-icbinv-property");
    var mqttInputHomieCleanAttrsShutdown = document.getElementById("settings-mqtt-input-homie-clean-attrs-shutdown");

    var mqttInputHassEnabled = document.getElementById("settings-mqtt-input-homeassistant-enabled");
    var mqttInputHassCleanAutoconfShutdown = document.getElementById("settings-mqtt-input-homeassistant-clean-autoconf-shutdown");

    mqttInputEnabled.addEventListener("input", updateMqttSaveButton);
    mqttInputServer.addEventListener("input", updateMqttSaveButton);
    mqttInputPort.addEventListener("input", updateMqttSaveButton);
    mqttInputUsername.addEventListener("input", updateMqttSaveButton);
    mqttInputPassword.addEventListener("input", updateMqttSaveButton);

    mqttInputFriendlyName.addEventListener("input", updateMqttSaveButton);
    mqttInputIdentifier.addEventListener("input", updateMqttSaveButton);
    mqttInputProvideMapData.addEventListener("input", updateMqttSaveButton);

    mqttInputHomieEnabled.addEventListener("input", updateMqttSaveButton);
    mqttInputHomieAddICBINVProp.addEventListener("input", updateMqttSaveButton);
    mqttInputHomieCleanAttrsShutdown.addEventListener("input", updateMqttSaveButton);

    mqttInputHassEnabled.addEventListener("input", updateMqttSaveButton);
    mqttInputHassCleanAutoconfShutdown.addEventListener("input", updateMqttSaveButton);

    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getMqttConfig();

        mqttInputEnabled.checked = (res.enabled === true);
        mqttInputServer.value = res.server || "foobar.example";
        mqttInputPort.value = res.port || 1883;
        mqttInputUsername.value = res.username || "";
        mqttInputPassword.value = res.password || "";
        mqttInputCa.value = res.ca || "";
        mqttInputClientCert.value = res.clientCert || "";
        mqttInputClientKey.value = res.clientKey || "";

        mqttInputFriendlyName.value = res.friendlyName || "Valetudo Robot";
        mqttInputIdentifier.value = res.identifier || "robot";
        mqttInputProvideMapData.checked = (res.provideMapData === true);

        mqttInputHomieEnabled.checked = (res.homie.enabled === true);
        mqttInputHomieAddICBINVProp.checked = (res.homie.addICBINVMapProperty === true);
        mqttInputHomieCleanAttrsShutdown.checked = (res.homie.cleanAttributesOnShutdown === true);

        mqttInputHassEnabled.checked = (res.homeassistant.enabled === true);
        mqttInputHassCleanAutoconfShutdown.checked = (res.homeassistant.cleanAutoconfOnShutdown === true);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsMqtt.removeAttribute("indeterminate");
    }
}

function updateMqttSaveButton() {
    var mqttInputSaveButton = document.getElementById("settings-mqtt-input-save-button");
    var mqttInputIdentifier = document.getElementById("settings-mqtt-input-identifier");
    var mqttInputServer = document.getElementById("settings-mqtt-input-server");

    if (mqttInputIdentifier.value && mqttInputIdentifier.value !== "" &&
        mqttInputServer.value && mqttInputServer.value !== "") {

        mqttInputSaveButton.removeAttribute("disabled");
    } else {
        mqttInputSaveButton.setAttribute("disabled", "disabled");
    }
}

async function handleMqttSettingsSaveButton() {
    var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");
    var mqttInputEnabled = document.getElementById("settings-mqtt-input-enabled");
    var mqttInputServer = document.getElementById("settings-mqtt-input-server");
    var mqttInputPort = document.getElementById("settings-mqtt-input-port");
    var mqttInputUsername = document.getElementById("settings-mqtt-input-username");
    var mqttInputPassword = document.getElementById("settings-mqtt-input-password");
    var mqttInputCa = document.getElementById("settings-mqtt-input-ca");
    var mqttInputClientCert = document.getElementById("settings-mqtt-input-client-cert");
    var mqttInputClientKey = document.getElementById("settings-mqtt-input-client-key");

    var mqttInputFriendlyName = document.getElementById("settings-mqtt-input-friendly-name");
    var mqttInputIdentifier = document.getElementById("settings-mqtt-input-identifier");
    var mqttInputProvideMapData = document.getElementById("settings-mqtt-input-provide-map-data");

    var mqttInputHomieEnabled = document.getElementById("settings-mqtt-input-homie-enabled");
    var mqttInputHomieAddICBINVProp = document.getElementById("settings-mqtt-input-homie-icbinv-property");
    var mqttInputHomieCleanAttrsShutdown = document.getElementById("settings-mqtt-input-homie-clean-attrs-shutdown");

    var mqttInputHassEnabled = document.getElementById("settings-mqtt-input-homeassistant-enabled");
    var mqttInputHassCleanAutoconfShutdown = document.getElementById("settings-mqtt-input-homeassistant-clean-autoconf-shutdown");

    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.saveMqttConfig({
            enabled: mqttInputEnabled.checked,
            server: mqttInputServer.value,
            port: parseInt(mqttInputPort.value),
            username: mqttInputUsername.value,
            password: mqttInputPassword.value,
            ca: mqttInputCa.value,
            clientCert: mqttInputClientCert.value,
            clientKey: mqttInputClientKey.value,
            identifier: mqttInputIdentifier.value,
            friendlyName: mqttInputFriendlyName.value,
            homie: {
                enabled: mqttInputHomieEnabled.checked,
                addICBINVMapProperty: mqttInputHomieAddICBINVProp.checked,
                cleanAttributesOnShutdown: mqttInputHomieCleanAttrsShutdown.checked
            },
            homeassistant: {
                enabled: mqttInputHassEnabled.checked,
                cleanAutoconfOnShutdown: mqttInputHassCleanAutoconfShutdown.checked
            },
            provideMapData: mqttInputProvideMapData.checked,
        });
        ons.notification.toast(
            "MQTT settings saved. MQTT Client will apply changes now.",
            {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
        fn.popPage();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsMqtt.removeAttribute("indeterminate");
    }
}

window.updateSettingsMqttPage = updateSettingsMqttPage;
window.handleMqttSettingsSaveButton = handleMqttSettingsSaveButton;
