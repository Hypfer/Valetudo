/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsSoundVolumePage() {
    var loadingBarSettingsSoundVolume = document.getElementById("loading-bar-settings-sound-voice");
    var soundVolumeInputVolume = document.getElementById("settings-sound-voice-input-volume");

    loadingBarSettingsSoundVolume.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getSoundVolume();
        soundVolumeInputVolume.value = res;
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
    }
}

function updateSoundVolumeSaveButton() {
    var soundVolumeInputVolume = document.getElementById("settings-sound-voice-input-volume");
    var soundVolumeInputSaveButton = document.getElementById("settings-sound-voice-input-save-button");

    if (soundVolumeInputVolume.value && soundVolumeInputVolume.value !== "") {
        soundVolumeInputSaveButton.removeAttribute("disabled");
    } else {
        soundVolumeInputSaveButton.setAttribute("disabled", "disabled");
    }
}

async function handleSoundVolumeSettingsSaveButton() {
    var loadingBarSettingsSoundVolume = document.getElementById("loading-bar-settings-sound-voice");
    var soundVolumeInputVolume = document.getElementById("settings-sound-voice-input-volume");

    loadingBarSettingsSoundVolume.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.setSoundVolume(soundVolumeInputVolume.value);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
    }
}

async function handleSoundVolumeSettingsTestButton() {
    var loadingBarSettingsSoundVolume = document.getElementById("loading-bar-settings-sound-voice");

    loadingBarSettingsSoundVolume.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.testSoundVolume();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
    }
}

function InitSettingsSoundVolumePage() {
    var voiceUploadForm = document.getElementById("voice-upload-form");

    voiceUploadForm.onsubmit =
    function(event) {
        var loadingBarSettingsSoundVolume = document.getElementById("loading-bar-settings-sound-voice");
        var voicePackUploadButton = document.getElementById("settings-sound-voice-upload-pack-button");
        var voicePackFileBrowser = document.getElementById("settings-sound-voice-upload-browser");

        event.preventDefault();
        var file = voicePackFileBrowser.files[0];
        if (file == undefined) {
            ons.notification.toast("Please select a voice pack before uploading.",
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
            voicePackUploadButton.disabled = true;
            var uploadText = voicePackUploadButton.innerText;
            voicePackUploadButton.innerText = "Uploading voice pack...";
            postFile(
                "api/install_voice_pack", file,
                function(p) {
                    loadingBarSettingsSoundVolume.value = (p * 0.9);
                },
                function(err, res) {
                    if (err) {
                        ons.notification.toast(
                            err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                        voicePackUploadButton.innerText = uploadText;
                        voicePackUploadButton.disabled = false;
                        loadingBarSettingsSoundVolume.value = 0;
                    } else {
                        voicePackUploadButton.innerText = "Installing voice pack...";
                        getVoicePackInstallStatus(function(err, data) {
                            if (!err) {
                                loadingBarSettingsSoundVolume.value = 90 + (data.progress * 0.1);

                                if (data.progress == 100 || data.error != 0) {
                                    if (data.error != 0) {
                                        ons.notification.toast("Failed to install voice pack.", {
                                            buttonLabel: "Dismiss",
                                            timeout: window.fn.toastErrorTimeout
                                        });
                                    } else {
                                        ons.notification.toast("Voice pack was successfully installed.",
                                            {
                                                buttonLabel: "Dismiss",
                                                timeout: window.fn.toastOKTimeout
                                            });
                                    }
                                    voicePackUploadButton.innerText = uploadText;
                                    voicePackUploadButton.disabled = false;
                                    loadingBarSettingsSoundVolume.value = 0;
                                }
                            } else {
                                voicePackUploadButton.innerText = uploadText;
                                voicePackUploadButton.disabled = false;
                                loadingBarSettingsSoundVolume.value = 0;
                            }
                        });
                    }
                });
        }
    };

    updateSettingsSoundVolumePage();
}

function postFile(url, path, progressCallback, callback) {
    var formData = new FormData();
    formData.append("file", path);

    var request = new XMLHttpRequest();
    request.onerror = function(e) {
        console.error(request);
        callback("There was an error: " + request.status);
    };

    request.onload = function(e) {
        if (request.status >= 200 && request.status < 400) {
            try {
                callback(null, JSON.parse(request.responseText));
            } catch (err) {
                callback(null, request.responseText);
            }
        } else {
            console.error(request);
            callback("There was an error: " + request.status);
        }
    };

    request.upload.onprogress = function(e) {
        var p = Math.round(100 / e.total * e.loaded);
        progressCallback(p);
    };

    request.onerror = function() {
        callback("Connection error");
    };

    request.open("POST", url);
    request.send(formData);
}

function getVoicePackInstallStatus(callback) {
    setTimeout(async function() {
        try {
            let res = await ApiService.getInstallVoicePackStatus();
            callback(null, res);
            if (res.progress != 100 && res.error == 0) {
                getVoicePackInstallStatus(callback);
            }
        } catch (err) {
            callback(err);
        }
    }, 1000);
}

window.InitSettingsSoundVolumePage = InitSettingsSoundVolumePage;
window.updateSoundVolumeSaveButton = updateSoundVolumeSaveButton;
window.handleSoundVolumeSettingsSaveButton = handleSoundVolumeSettingsSaveButton;
window.handleSoundVolumeSettingsTestButton = handleSoundVolumeSettingsTestButton;