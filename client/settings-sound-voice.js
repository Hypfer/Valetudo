/*global ons, fn*/
var loadingBarSettingsSoundVolume = document.getElementById("loading-bar-settings-sound-voice");
var soundVolumeInputVolume = document.getElementById("settings-sound-voice-input-volume");

var soundVolumeInputSaveButton = document.getElementById("settings-sound-voice-input-save-button");
var voiceUploadForm = document.getElementById("voice-upload-form");
var voicePackUploadButton = document.getElementById("settings-sound-voice-upload-pack-button");
var voicePackFileBrowser = document.getElementById("settings-sound-voice-upload-browser");

ons.getScriptPage().onShow = function() {
    updateSettingsSoundVolumePage();
};

function updateSettingsSoundVolumePage() {
    loadingBarSettingsSoundVolume.setAttribute("indeterminate", "indeterminate");
    fn.request("api/get_sound_volume", "GET", function(err, res) {
        loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
        if (!err) {
            soundVolumeInputVolume.value = res;
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

// eslint-disable-next-line no-unused-vars
function updateSoundVolumeSaveButton() {
    if (soundVolumeInputVolume.value && soundVolumeInputVolume.value !== "") {
        soundVolumeInputSaveButton.removeAttribute("disabled");
    } else {
        soundVolumeInputSaveButton.setAttribute("disabled", "disabled");
    }
}

// eslint-disable-next-line no-unused-vars
function handleSoundVolumeSettingsSaveButton() {
    loadingBarSettingsSoundVolume.setAttribute("indeterminate", "indeterminate");

    fn.requestWithPayload(
        "api/set_sound_volume", JSON.stringify({volume: soundVolumeInputVolume.value}), "PUT",
        function(err) {
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            }
            loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
        });
}

// eslint-disable-next-line no-unused-vars
function handleSoundVolumeSettingsTestButton() {
    loadingBarSettingsSoundVolume.setAttribute("indeterminate", "indeterminate");

    fn.request("api/test_sound_volume", "PUT", function(err, res) {
        loadingBarSettingsSoundVolume.removeAttribute("indeterminate");
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

voiceUploadForm.onsubmit =
    function(event) {
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
            fn.postFile(
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

function getVoicePackInstallStatus(callback) {
    setTimeout(function() {
        fn.request("api/install_voice_pack_status", "GET", function(err, res) {
            callback(err, res);
            if (!err) {
                if (res.progress != 100 && res.error == 0) {
                    getVoicePackInstallStatus(callback);
                }
            }
        });
    }, 1000);
}
