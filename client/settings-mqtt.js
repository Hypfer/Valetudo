/*global ons, fn*/
var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");
var mqttInputEnabled =
    document.getElementById("settings-mqtt-input-enabled");
var mqttInputIdentifier =
    document.getElementById("settings-mqtt-input-identifier");
var mqttInputTopicPrefix =
    document.getElementById("settings-mqtt-input-topic-prefix");
var mqttInputAutoconfPrefix =
    document.getElementById("settings-mqtt-input-autoconf-prefix");
var mqttInputBrokerUrl =
    document.getElementById("settings-mqtt-input-broker-url");
var mqttInputProvideMapData =
    document.getElementById("settings-mqtt-input-provide-map-data");
var mqttInputCaPath =
    document.getElementById("settings-mqtt-input-ca-path");
var mqttInputQoS =
    document.getElementById("settings-mqtt-input-qos");

var mqttInputSaveButton = document.getElementById("settings-mqtt-input-save-button");

mqttInputEnabled.addEventListener("input", updateMqttSaveButton);
mqttInputIdentifier.addEventListener("input", updateMqttSaveButton);
mqttInputTopicPrefix.addEventListener("input", updateMqttSaveButton);
mqttInputAutoconfPrefix.addEventListener("input", updateMqttSaveButton);
mqttInputBrokerUrl.addEventListener("input", updateMqttSaveButton);
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
            mqttInputIdentifier.value = res.identifier || "rockrobo";
            mqttInputTopicPrefix.value = res.topicPrefix || "valetudo";
            mqttInputAutoconfPrefix.value = res.autoconfPrefix || "";
            mqttInputBrokerUrl.value = res.broker_url || "mqtt://user:pass@foobar.example";
            mqttInputProvideMapData.checked = (res.provideMapData == 1);
            mqttInputCaPath.value = res.caPath || "";
            mqttInputQoS.value = res.qos || 0;
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

function updateMqttSaveButton() {
    if (mqttInputIdentifier.value && mqttInputIdentifier.value !== "" &&
        mqttInputTopicPrefix.value && mqttInputTopicPrefix.value != "" &&
        mqttInputBrokerUrl.value && mqttInputBrokerUrl.value != "") {

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
            identifier: mqttInputIdentifier.value,
            topicPrefix: mqttInputTopicPrefix.value,
            autoconfPrefix: mqttInputAutoconfPrefix.value,
            broker_url: mqttInputBrokerUrl.value,
            provideMapData: mqttInputProvideMapData.checked,
            caPath: mqttInputCaPath.value,
            qos: parseInt(mqttInputQoS.value)
        }),
        "PUT", function(err) {
            if (err) {
                loadingBarSettingsMqtt.removeAttribute("indeterminate");
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } else {
                ons.notification
                    .alert(
                        "Successfully applied new MQTT settings.<br>After pressing OK the page will refresh.")
                    .then(function() {
                        location.reload();
                    });
            }
        });
}
