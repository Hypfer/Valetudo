/*eslint-env browser*/
/*global ons, fn*/
var currentRefreshTimer;

var startButton = document.getElementById("start-button");
var pauseButton = document.getElementById("pause-button");
var stopButton = document.getElementById("stop-button");
var spotButton = document.getElementById("spot-button");
var goToButton = document.getElementById("go-to-button");
var areaButton = document.getElementById("area-button");
var fanspeedButton = document.getElementById("fanspeed-button");
var findRobotButton = document.getElementById("find-robot-button");
var homeButton = document.getElementById("home-button");
var batteryStatusText = document.getElementById("battery-status-text");
var batteryStatusBar = document.getElementById("battery-status-bar");
var robotState = document.getElementById("robot-state");
var robotStateDetailsM2 = document.getElementById("robot-state-details-m2");
var robotStateDetailsTime = document.getElementById("robot-state-details-time");
var loadingBarHome = document.getElementById("loading-bar-home");

var config = {};

var BUTTONS = {
    "start": {button: startButton, url: "api/start_cleaning"},
    "pause": {button: pauseButton, url: "api/pause_cleaning"},
    "stop": {button: stopButton, url: "api/stop_cleaning"},
    "home": {button: homeButton, url: "api/drive_home"},
    "find": {button: findRobotButton, url: "api/find_robot"},
    "spot": {button: spotButton, url: "api/spot_clean"}
};

if (!ons.platform.isAndroid()) {
    var progressStyle = document.querySelectorAll(".progressStyle");
    for (let progress of progressStyle) { // How Why Help
        progress.hasAttribute("modifier")
            ? progress.setAttribute("modifier", progress.getAttribute("modifier") + " ios")
            : progress.setAttribute("modifier", "ios");
    }
}

// eslint-disable-next-line no-unused-vars
function handleControlButton(button) {
    var btn = BUTTONS[button];
    if (btn === undefined) {
        throw new Error("Invalid button");
    } else {
        btn.button.setAttribute("disabled", "disabled");

        loadingBarHome.setAttribute("indeterminate", "indeterminate");
        fn.request(btn.url, "PUT", function(err) {
            if (err) {
                btn.button.removeAttribute("disabled");
                loadingBarHome.removeAttribute("indeterminate");
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } else {
                window.clearTimeout(currentRefreshTimer);
                window.setTimeout(function() {
                    updateHomePage();
                }, 500);
            }
        });
    }
}

var fanspeedPresets =
    {1: "Whisper", 38: "Quiet", 60: "Balanced", 75: "Turbo", 100: "Max", 105: "Mop"};

// eslint-disable-next-line no-unused-vars
function handleFanspeedButton() {
    window.clearTimeout(currentRefreshTimer);

    ons.openActionSheet({
        title: "Select power mode",
        cancelable: true,
        buttons: [...Object.values(fanspeedPresets), {label: "Cancel", icon: "md-close"}]
    })
        .then(function(index) {
            var level = Object.keys(fanspeedPresets)[index];

            if (level) {
                loadingBarHome.setAttribute("indeterminate", "indeterminate");
                fanspeedButton.setAttribute("disabled", "disabled");
                fn.requestWithPayload(
                    "api/fanspeed", JSON.stringify({speed: level}), "PUT", function(err, res) {
                        if (err) {
                            fanspeedButton.removeAttribute("disabled");
                            loadingBarHome.removeAttribute("indeterminate");
                            ons.notification.toast(
                                err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                        } else {
                            window.clearTimeout(currentRefreshTimer);
                            window.setTimeout(function() {
                                updateHomePage();
                            }, 150);
                        }
                    });
            } else {
                window.setTimeout(function() {
                    updateHomePage();
                }, 3000);
            }
        });
}

// eslint-disable-next-line no-unused-vars
function handleGoToButton() {
    window.clearTimeout(currentRefreshTimer);
    var options = [];

    for (var i = 0; i < config.spots.length; i++) {
        options.push(config.spots[i][0]);
    }

    options.push({label: "Cancel", icon: "md-close"});

    ons.openActionSheet({title: "Go to", cancelable: true, buttons: options}).then(function(index) {
        if (index > -1 && index < config.spots.length) {
            fn.requestWithPayload(
                "api/go_to", JSON.stringify({x: config.spots[index][1], y: config.spots[index][2]}),
                "PUT", function(err) {
                    if (err) {
                        ons.notification.toast(err, {buttonLabel: "Dismiss", timeout: 1500});
                    }
                    window.setTimeout(function() {
                        updateHomePage();
                    }, 3000);
                });
        } else {
            window.setTimeout(function() {
                updateHomePage();
            }, 3000);
        }
    });
}

// eslint-disable-next-line no-unused-vars
function handleAreaButton() {
    window.clearTimeout(currentRefreshTimer);
    var options = [];

    for (var i = 0; i < config.areas.length; i++) {
        options.push(config.areas[i][0]);
    }

    options.push({label: "Cancel", icon: "md-close"});

    ons.openActionSheet({title: "Clean area", cancelable: true, buttons: options})
        .then(function(index) {
            if (index > -1 && index < config.areas.length) {
                fn.requestWithPayload(
                    "api/start_cleaning_zone_by_name", JSON.stringify([config.areas[index][0]]),
                    "PUT", function(err) {
                        if (err) {
                            ons.notification.toast(err, {buttonLabel: "Dismiss", timeout: 1500});
                        }
                        window.setTimeout(function() {
                            updateHomePage();
                        }, 3000);
                    });
            } else {
                window.setTimeout(function() {
                    updateHomePage();
                }, 3000);
            }
        });
}

function updateHomePage() {
    loadingBarHome.setAttribute("indeterminate", "indeterminate");
    fn.request("api/current_status", "GET", function(err, res) {
        loadingBarHome.removeAttribute("indeterminate");
        fanspeedButton.removeAttribute("disabled");
        findRobotButton.removeAttribute("disabled");
        spotButton.removeAttribute("disabled");

        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            if (res.battery) {
                batteryStatusText.innerHTML = "Battery: " + res.battery + "%";
                batteryStatusBar.value = res.battery;
            }

            robotState.innerHTML = res.human_state;
            if (res.error_code) {
                robotState.innerHTML +=
                    "<span class=\"robot-error\"><ons-icon icon=\"fa-exclamation-triangle\"></ons-icon> " +
                    res.human_error +
                    " <ons-icon icon=\"fa-exclamation-triangle\"></ons-icon></span>";
            }

            if (res.in_cleaning === 1 || res.in_cleaning === 2 ||
                ["SPOT_CLEANING", "GOING_TO_TARGET"].indexOf(res.state) != -1) {
                if (["IDLE", "PAUSED", "CHARGER_DISCONNECTED"].indexOf(res.state) != -1) {
                    pauseButton.setAttribute("disabled", "disabled");
                    startButton.removeAttribute("disabled");
                } else {
                    pauseButton.removeAttribute("disabled");
                    startButton.setAttribute("disabled", "disabled");
                }
                spotButton.setAttribute("disabled", "disabled");
            } else {
                spotButton.removeAttribute("disabled");
                pauseButton.setAttribute("disabled", "disabled");
                if (res.state !== 6) {
                    startButton.removeAttribute("disabled");
                } else {
                    pauseButton.removeAttribute("disabled");
                    startButton.setAttribute("disabled", "disabled");
                }
            }

            if (["CHARGING", "DOCKING", "PAUSED", "IDLE"].indexOf(res.state) != -1) {
                stopButton.setAttribute("disabled", "disabled");
            } else {
                stopButton.removeAttribute("disabled");
            }

            if (["RETURNING_HOME", "CHARGING", "CHARGING_PROBLEM"].indexOf(res.state) != -1) {
                homeButton.setAttribute("disabled", "disabled");
            } else {
                homeButton.removeAttribute("disabled");
            }

            robotStateDetailsM2.innerHTML =
                "Area: " + ("00" + (res.clean_area / 1000000).toFixed(2)).slice(-6) + " m²";
            robotStateDetailsTime.innerHTML = "Time: " + window.fn.secondsToHms(res.clean_time);
            fanspeedButton.innerHTML =
                "<ons-icon icon=\"fa-superpowers\"></ons-icon> " +
                (fanspeedPresets[res.fan_power] || `Custom ${res.fan_power}%`);

            currentRefreshTimer =
                window.setTimeout(function() {
                    updateHomePage();
                }.bind(this), 5000);
        }
    });
}

ons.getScriptPage().onShow = function() {
    /* check for area and go to configuration */
    fn.request("api/get_config", "GET", function(err, res) {
        config = res;
        if (config.spots)
            if (config.spots.length > 0)
                goToButton.removeAttribute("disabled");
        if (config.areas)
            if (config.areas.length > 0)
                areaButton.removeAttribute("disabled");
    });
    updateHomePage();
};
if (ons.getScriptPage().hasAttribute("shown"))
    ons.getScriptPage().onShow();

ons.getScriptPage().onHide = function() {
    window.clearTimeout(currentRefreshTimer);
};
