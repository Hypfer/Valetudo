/*global ons, fn*/
import {ApiService} from "./services/api.service.js";

async function updateSettingsMqttPage() {
    var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");

    var mqttInputEnabled = document.getElementById("settings-mqtt-input-enabled");

    var mqttInputConnectionHost = document.getElementById("settings-mqtt-input-connection-host");
    var mqttInputConnectionPort = document.getElementById("settings-mqtt-input-connection-port");

    var mqttInputTlsEnabled = document.getElementById("settings-mqtt-input-tls-enabled");
    var mqttInputTlsCa = document.getElementById("settings-mqtt-input-tls-ca");

    var mqttInputCredentialsAuthEnabled = document.getElementById("settings-mqtt-input-credentials-auth-enabled");
    var mqttInputCredentialsAuthUsername = document.getElementById("settings-mqtt-input-credentials-auth-username");
    var mqttInputCredentialsAuthPassword = document.getElementById("settings-mqtt-input-credentials-auth-password");

    var mqttInputClientCertAuthEnabled = document.getElementById("settings-mqtt-input-client-cert-auth-enabled");
    var mqttInputClientCertAuthCert = document.getElementById("settings-mqtt-input-client-cert-auth-client-cert");
    var mqttInputClientCertAuthKey = document.getElementById("settings-mqtt-input-client-cert-auth-client-key");

    var mqttInputIdentityFriendlyName = document.getElementById("settings-mqtt-input-identity-friendly-name");
    var mqttInputIdentityIdentifier = document.getElementById("settings-mqtt-input-identity-identifier");

    var mqttInputInterfacesHomieEnabled = document.getElementById("settings-mqtt-input-interfaces-homie-enabled");
    var mqttInputInterfacesHomieICBINVProperty = document.getElementById("settings-mqtt-input-interfaces-homie-icbinv-property");
    var mqttInputInterfacesHomieCleanAttrsShutdown = document.getElementById("settings-mqtt-input-interfaces-homie-clean-attrs-shutdown");

    var mqttInputInterfacesHomeassistantEnabled = document.getElementById("settings-mqtt-input-interfaces-homeassistant-enabled");
    var mqttInputInterfacesHomeassistantCleanAutoconfShutdown = document.getElementById("settings-mqtt-input-interfaces-homeassistant-clean-autoconf-shutdown");

    var mqttInputCustomizationTopicPrefix = document.getElementById("settings-mqtt-input-customization-topic-prefix");
    var mqttInputCustomizationProvideMapData = document.getElementById("settings-mqtt-input-customization-provide-map-data");

    [
        mqttInputEnabled,

        mqttInputConnectionHost,
        mqttInputConnectionPort,

        mqttInputTlsEnabled,
        mqttInputTlsCa,

        mqttInputCredentialsAuthEnabled,
        mqttInputCredentialsAuthUsername,
        mqttInputCredentialsAuthPassword,

        mqttInputClientCertAuthEnabled,
        mqttInputClientCertAuthCert,
        mqttInputClientCertAuthKey,

        mqttInputIdentityFriendlyName,
        mqttInputIdentityIdentifier,

        mqttInputInterfacesHomieEnabled,
        mqttInputInterfacesHomieICBINVProperty,
        mqttInputInterfacesHomieCleanAttrsShutdown,

        mqttInputInterfacesHomeassistantEnabled,
        mqttInputInterfacesHomeassistantCleanAutoconfShutdown,

        mqttInputCustomizationTopicPrefix,
        mqttInputCustomizationProvideMapData
    ].forEach(elem => {
        elem.addEventListener("input", updateMqttSaveButton)
    });

    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getMqttConfig();

        mqttInputEnabled.checked = (res.enabled === true);

        mqttInputConnectionHost.value = res.connection.host;
        mqttInputConnectionPort.value = res.connection.port;

        mqttInputTlsEnabled.checked = (res.connection.tls.enabled === true);
        mqttInputTlsCa.value = res.connection.tls.ca;

        mqttInputCredentialsAuthEnabled.checked = (res.connection.authentication.credentials.enabled === true);
        mqttInputCredentialsAuthUsername.value = res.connection.authentication.credentials.username;
        mqttInputCredentialsAuthPassword.value = res.connection.authentication.credentials.password;

        mqttInputClientCertAuthEnabled.checked = (res.connection.authentication.clientCertificate.enabled === true);
        mqttInputClientCertAuthCert.value = res.connection.authentication.clientCertificate.certificate;
        mqttInputClientCertAuthKey.value = res.connection.authentication.clientCertificate.key;

        mqttInputIdentityFriendlyName.value = res.identity.friendlyName;
        mqttInputIdentityIdentifier.value = res.identity.identifier;

        mqttInputInterfacesHomieEnabled.checked = (res.interfaces.homie.enabled === true);
        mqttInputInterfacesHomieICBINVProperty.checked = (res.interfaces.homie.addICBINVMapProperty === true);
        mqttInputInterfacesHomieCleanAttrsShutdown.checked = (res.interfaces.homie.cleanAttributesOnShutdown === true);

        mqttInputInterfacesHomeassistantEnabled.checked = (res.interfaces.homeassistant.enabled === true);
        mqttInputInterfacesHomeassistantCleanAutoconfShutdown.checked = (res.interfaces.homeassistant.cleanAutoconfOnShutdown === true);

        mqttInputCustomizationTopicPrefix.value = res.customizations.topicPrefix;
        mqttInputCustomizationProvideMapData.checked = (res.customizations.provideMapData === true);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsMqtt.removeAttribute("indeterminate");
    }
}

function updateMqttSaveButton() {
    var mqttInputSaveButton = document.getElementById("settings-mqtt-input-save-button");
    var mqttInputConnectionHost = document.getElementById("settings-mqtt-input-connection-host");
    var mqttInputConnectionPort = document.getElementById("settings-mqtt-input-connection-port");

    if (mqttInputConnectionHost.value && mqttInputConnectionHost.value !== "" &&
        mqttInputConnectionPort.value && mqttInputConnectionPort.value !== "") {

        mqttInputSaveButton.removeAttribute("disabled");
    } else {
        mqttInputSaveButton.setAttribute("disabled", "disabled");
    }
}

async function handleMqttSettingsSaveButton() {
    var loadingBarSettingsMqtt = document.getElementById("loading-bar-settings-mqtt");

    var mqttInputEnabled = document.getElementById("settings-mqtt-input-enabled");

    var mqttInputConnectionHost = document.getElementById("settings-mqtt-input-connection-host");
    var mqttInputConnectionPort = document.getElementById("settings-mqtt-input-connection-port");

    var mqttInputTlsEnabled = document.getElementById("settings-mqtt-input-tls-enabled");
    var mqttInputTlsCa = document.getElementById("settings-mqtt-input-tls-ca");

    var mqttInputCredentialsAuthEnabled = document.getElementById("settings-mqtt-input-credentials-auth-enabled");
    var mqttInputCredentialsAuthUsername = document.getElementById("settings-mqtt-input-credentials-auth-username");
    var mqttInputCredentialsAuthPassword = document.getElementById("settings-mqtt-input-credentials-auth-password");

    var mqttInputClientCertAuthEnabled = document.getElementById("settings-mqtt-input-client-cert-auth-enabled");
    var mqttInputClientCertAuthCert = document.getElementById("settings-mqtt-input-client-cert-auth-client-cert");
    var mqttInputClientCertAuthKey = document.getElementById("settings-mqtt-input-client-cert-auth-client-key");

    var mqttInputIdentityFriendlyName = document.getElementById("settings-mqtt-input-identity-friendly-name");
    var mqttInputIdentityIdentifier = document.getElementById("settings-mqtt-input-identity-identifier");

    var mqttInputInterfacesHomieEnabled = document.getElementById("settings-mqtt-input-interfaces-homie-enabled");
    var mqttInputInterfacesHomieICBINVProperty = document.getElementById("settings-mqtt-input-interfaces-homie-icbinv-property");
    var mqttInputInterfacesHomieCleanAttrsShutdown = document.getElementById("settings-mqtt-input-interfaces-homie-clean-attrs-shutdown");

    var mqttInputInterfacesHomeassistantEnabled = document.getElementById("settings-mqtt-input-interfaces-homeassistant-enabled");
    var mqttInputInterfacesHomeassistantCleanAutoconfShutdown = document.getElementById("settings-mqtt-input-interfaces-homeassistant-clean-autoconf-shutdown");

    var mqttInputCustomizationTopicPrefix = document.getElementById("settings-mqtt-input-customization-topic-prefix");
    var mqttInputCustomizationProvideMapData = document.getElementById("settings-mqtt-input-customization-provide-map-data");
    loadingBarSettingsMqtt.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.saveMqttConfig({
            "enabled": mqttInputEnabled.checked,
            "connection": {
                "host": mqttInputConnectionHost.value,
                "port": parseInt(mqttInputConnectionPort.value),
                "tls": {
                    "enabled": mqttInputTlsEnabled.checked,
                    "ca": mqttInputTlsCa.value
                },
                "authentication": {
                    "credentials": {
                        "enabled": mqttInputCredentialsAuthEnabled.checked,
                        "username": mqttInputCredentialsAuthUsername.value,
                        "password": mqttInputCredentialsAuthPassword.value
                    },
                    "clientCertificate": {
                        "enabled": mqttInputClientCertAuthEnabled.checked,
                        "certificate": mqttInputClientCertAuthCert.value,
                        "key": mqttInputClientCertAuthKey.value
                    }
                }
            },
            "identity": {
                "friendlyName": mqttInputIdentityFriendlyName.value,
                "identifier": mqttInputIdentityIdentifier.value
            },
            "interfaces": {
                "homie": {
                    "enabled": mqttInputInterfacesHomieEnabled.checked,
                    "addICBINVMapProperty": mqttInputInterfacesHomieICBINVProperty.checked,
                    "cleanAttributesOnShutdown": mqttInputInterfacesHomieCleanAttrsShutdown.checked
                },
                "homeassistant": {
                    "enabled": mqttInputInterfacesHomeassistantEnabled.checked,
                    "cleanAutoconfOnShutdown": mqttInputInterfacesHomeassistantCleanAutoconfShutdown.checked
                }
            },
            "customizations": {
                "topicPrefix": mqttInputCustomizationTopicPrefix.value,
                "provideMapData": mqttInputCustomizationProvideMapData.checked
            }
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
