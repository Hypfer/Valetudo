/*global ons, fn*/
var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");
var mqttInputEnabled =
    document.getElementById("settings-mqtt-input-enabled");
var mqttInputServer =
    document.getElementById("settings-mqtt-input-server");
var mqttInputPort =
    document.getElementById("settings-mqtt-input-port");
var mqttInputClientId =
    document.getElementById("settings-mqtt-input-clientId");
var mqttInputUsername =
    document.getElementById("settings-mqtt-input-username");
var mqttInputPassword =
    document.getElementById("settings-mqtt-input-password");
var mqttInputUsetls =
    document.getElementById("settings-mqtt-input-usetls");
var mqttInputCaPath =
    document.getElementById("settings-mqtt-input-ca-path");
var mqttInputQoS =
    document.getElementById("settings-mqtt-input-qos");

var mqttInputIdentifier =
    document.getElementById("settings-mqtt-input-identifier");
var mqttInputTopicPrefix =
    document.getElementById("settings-mqtt-input-topic-prefix");
var mqttInputAutoconfPrefix =
    document.getElementById("settings-mqtt-input-autoconf-prefix");
var mqttInputProvideMapData =
    document.getElementById("settings-mqtt-input-provide-map-data");

var mqttInputSaveButton = document.getElementById("settings-mqtt-input-save-button");

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

ons.getScriptPage().onShow = function() {
    updateSettingsMqttPage();
};

function updateSettingsMqttPage() {
    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    fn.request("api/mqtt_config", "GET", function(err, res) {
        loadingBarSettingsMqtt.removeAttribute("indeterminate");
        if (!err) {
            mqttInputEnabled.checked = (res.enabled == 1);
            mqttInputServer.value = res.server || "foobar.example";
            mqttInputPort.value = res.port || 1883;
            mqttInputClientId.value = res.clientId || "";
            mqttInputUsername.value = res.username || "";
            mqttInputPassword.value = res.password || "";
            mqttInputUsetls.checked = (res.usetls == 1);
            mqttInputCaPath.value = res.caPath || "";
            mqttInputQoS.value = res.qos || 0;

            mqttInputIdentifier.value = res.identifier || "rockrobo";
            mqttInputTopicPrefix.value = res.topicPrefix || "valetudo";
            mqttInputAutoconfPrefix.value = res.autoconfPrefix || "";
            mqttInputProvideMapData.checked = (res.provideMapData == 1);
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

function updateMqttSaveButton() {
    if (mqttInputIdentifier.value && mqttInputIdentifier.value !== "" &&
        mqttInputTopicPrefix.value && mqttInputTopicPrefix.value != "" &&
        mqttInputServer.value && mqttInputServer.value != "") {

        mqttInputSaveButton.removeAttribute("disabled");
    } else {
        mqttInputSaveButton.setAttribute("disabled", "disabled");
    }
}

// eslint-disable-next-line no-unused-vars
function handleMqttSettingsSaveButton() {
    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");

    fn.requestWithPayload(
        "api/mqtt_config",
        JSON.stringify({
            enabled: mqttInputEnabled.checked,
            server: mqttInputServer.value,
            port: mqttInputPort.value,
            clientId: mqttInputClientId.value,
            username: mqttInputUsername.value,
            password: mqttInputPassword.value,
            usetls: mqttInputUsetls.checked,
            caPath: mqttInputCaPath.value,
            qos: parseInt(mqttInputQoS.value),
            identifier: mqttInputIdentifier.value,
            topicPrefix: mqttInputTopicPrefix.value,
            autoconfPrefix: mqttInputAutoconfPrefix.value,
            provideMapData: mqttInputProvideMapData.checked
        }),
        "PUT", function(err) {
            loadingBarSettingsMqtt.removeAttribute("indeterminate");
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } else {
                ons.notification.toast(
                    "MQTT settings saved. MQTT Client will apply changes now.",
                    {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
                fn.popPage();
            }
        });
}
