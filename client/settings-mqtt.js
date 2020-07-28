/*global ons, fn*/
import {ApiService} from "./services/api.service.js";

async function updateSettingsMqttPage() {
    var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");
    var mqttInputEnabled = document.getElementById("settings-mqtt-input-enabled");
    var mqttInputServer = document.getElementById("settings-mqtt-input-server");
    var mqttInputPort = document.getElementById("settings-mqtt-input-port");
    var mqttInputClientId = document.getElementById("settings-mqtt-input-clientId");
    var mqttInputUsername = document.getElementById("settings-mqtt-input-username");
    var mqttInputPassword = document.getElementById("settings-mqtt-input-password");
    var mqttInputUsetls = document.getElementById("settings-mqtt-input-usetls");
    var mqttInputCa = document.getElementById("settings-mqtt-input-ca");
    var mqttInputClientCert = document.getElementById("settings-mqtt-input-client-cert");
    var mqttInputClientKey = document.getElementById("settings-mqtt-input-client-key");
    var mqttInputQoS = document.getElementById("settings-mqtt-input-qos");

    var mqttInputIdentifier = document.getElementById("settings-mqtt-input-identifier");
    var mqttInputTopicPrefix = document.getElementById("settings-mqtt-input-topic-prefix");
    var mqttInputAutoconfPrefix = document.getElementById("settings-mqtt-input-autoconf-prefix");
    var mqttInputProvideMapData = document.getElementById("settings-mqtt-input-provide-map-data");

    mqttInputEnabled.addEventListener("input", updateMqttSaveButton);
    mqttInputServer.addEventListener("input", updateMqttSaveButton);
    mqttInputPort.addEventListener("input", updateMqttSaveButton);
    mqttInputClientId.addEventListener("input", updateMqttSaveButton);
    mqttInputUsername.addEventListener("input", updateMqttSaveButton);
    mqttInputPassword.addEventListener("input", updateMqttSaveButton);
    mqttInputUsetls.addEventListener("input", updateMqttSaveButton);

    mqttInputIdentifier.addEventListener("input", updateMqttSaveButton);
    mqttInputTopicPrefix.addEventListener("input", updateMqttSaveButton);
    mqttInputAutoconfPrefix.addEventListener("input", updateMqttSaveButton);
    mqttInputProvideMapData.addEventListener("input", updateMqttSaveButton);

    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getMqttConfig();

        mqttInputEnabled.checked = (res.enabled === true);
        mqttInputServer.value = res.server || "foobar.example";
        mqttInputPort.value = res.port || 1883;
        mqttInputClientId.value = res.clientId || "";
        mqttInputUsername.value = res.username || "";
        mqttInputPassword.value = res.password || "";
        mqttInputUsetls.checked = (res.usetls === true);
        mqttInputCa.value = res.ca || "";
        mqttInputClientCert.value = res.clientCert || "";
        mqttInputClientKey.value = res.clientKey || "";
        mqttInputQoS.value = res.qos || 0;

        mqttInputIdentifier.value = res.identifier || "rockrobo";
        mqttInputTopicPrefix.value = res.topicPrefix || "valetudo";
        mqttInputAutoconfPrefix.value = res.autoconfPrefix || "";
        mqttInputProvideMapData.checked = (res.provideMapData === true);
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
    var mqttInputTopicPrefix = document.getElementById("settings-mqtt-input-topic-prefix");
    var mqttInputServer = document.getElementById("settings-mqtt-input-server");

    if (mqttInputIdentifier.value && mqttInputIdentifier.value !== "" &&
        mqttInputTopicPrefix.value && mqttInputTopicPrefix.value !== "" &&
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
    var mqttInputClientId = document.getElementById("settings-mqtt-input-clientId");
    var mqttInputUsername = document.getElementById("settings-mqtt-input-username");
    var mqttInputPassword = document.getElementById("settings-mqtt-input-password");
    var mqttInputUsetls = document.getElementById("settings-mqtt-input-usetls");
    var mqttInputCa = document.getElementById("settings-mqtt-input-ca");
    var mqttInputClientCert = document.getElementById("settings-mqtt-input-client-cert");
    var mqttInputClientKey = document.getElementById("settings-mqtt-input-client-key");
    var mqttInputQoS = document.getElementById("settings-mqtt-input-qos");

    var mqttInputIdentifier = document.getElementById("settings-mqtt-input-identifier");
    var mqttInputTopicPrefix = document.getElementById("settings-mqtt-input-topic-prefix");
    var mqttInputAutoconfPrefix = document.getElementById("settings-mqtt-input-autoconf-prefix");
    var mqttInputProvideMapData = document.getElementById("settings-mqtt-input-provide-map-data");

    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.saveMqttConfig({
            enabled: mqttInputEnabled.checked,
            server: mqttInputServer.value,
            port: mqttInputPort.value,
            clientId: mqttInputClientId.value,
            username: mqttInputUsername.value,
            password: mqttInputPassword.value,
            usetls: mqttInputUsetls.checked,
            ca: mqttInputCa.value,
            clientCert: mqttInputClientCert.value,
            clientKey: mqttInputClientKey.value,
            qos: parseInt(mqttInputQoS.value),
            identifier: mqttInputIdentifier.value,
            topicPrefix: mqttInputTopicPrefix.value,
            autoconfPrefix: mqttInputAutoconfPrefix.value,
            provideMapData: mqttInputProvideMapData.checked
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
