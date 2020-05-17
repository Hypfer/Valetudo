/*global ons */

import { ApiService } from "./services/api.service.js";

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
/** @type {Array<{id:number, name:string}>} */
var zones = [];
/** @type {{[id: string]: string}} */
var fanspeedPresets = {};

if (!ons.platform.isAndroid()) {
    var progressStyle = document.querySelectorAll(".progressStyle");
    for (let progress of progressStyle) { // How Why Help
        progress.hasAttribute("modifier")
            ? progress.setAttribute("modifier", progress.getAttribute("modifier") + " ios")
            : progress.setAttribute("modifier", "ios");
    }
}

async function handleControlButton(button) {
    loadingBarHome.setAttribute("indeterminate", "indeterminate");

    try {
        switch (button) {
            case "start":
                startButton.setAttribute("disabled", "disabled");
                await ApiService.startCleaning();
                break;
            case "pause":
                pauseButton.setAttribute("disabled", "disabled");
                await ApiService.pauseCleaning();
                break;
            case "stop":
                stopButton.setAttribute("disabled", "disabled");
                ApiService.stopCleaning();
                break;
            case "home":
                homeButton.setAttribute("disabled", "disabled");
                ApiService.driveHome();
                break;
            case "find":
                findRobotButton.setAttribute("disabled", "disabled");
                ApiService.findRobot();
                break;
            case "spot":
                spotButton.setAttribute("disabled", "disabled");
                ApiService.spotClean();
                break;
            default:
                throw new Error("Invalid button");
        }

        window.clearTimeout(currentRefreshTimer);
        window.setTimeout(function() {
            updateHomePage();
        }, 500);
    } catch (err) {
        loadingBarHome.removeAttribute("indeterminate");
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }
}

async function handleFanspeedButton() {
    window.clearTimeout(currentRefreshTimer);

    let index = await ons.openActionSheet({
        title: "Select power mode",
        cancelable: true,
        buttons: [...Object.values(fanspeedPresets), {label: "Cancel", icon: "md-close"}]
    });

    var level = Object.keys(fanspeedPresets)[index];

    if (level) {
        loadingBarHome.setAttribute("indeterminate", "indeterminate");
        fanspeedButton.setAttribute("disabled", "disabled");
        try {
            await ApiService.setFanspeed(level);
            window.clearTimeout(currentRefreshTimer);
            window.setTimeout(function() {
                updateHomePage();
            }, 150);
        } catch (err) {
            fanspeedButton.removeAttribute("disabled");
            loadingBarHome.removeAttribute("indeterminate");
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    } else {
        window.setTimeout(function() {
            updateHomePage();
        }, 3000);
    }

}

async function handleGoToButton() {
    window.clearTimeout(currentRefreshTimer);
    var options = [];

    for (var i = 0; i < config.spots.length; i++) {
        options.push(config.spots[i][0]);
    }

    options.push({label: "Cancel", icon: "md-close"});

    let index = await ons.openActionSheet({title: "Go to", cancelable: true, buttons: options});
    if (index > -1 && index < config.spots.length) {
        try {
            await ApiService.goto(config.spots[index][1], config.spots[index][2]);
            window.setTimeout(function() {
                updateHomePage();
            }, 3000);
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: 1500});
        }
    } else {
        window.setTimeout(function() {
            updateHomePage();
        }, 3000);
    }
}

async function handleAreaButton() {
    window.clearTimeout(currentRefreshTimer);
    /** @type {Array<string|object>} */
    var options = zones ? zones.map(z => z.name) : [];

    options.push({label: "Cancel", icon: "md-close"});

    let index = await ons.openActionSheet({title: "Clean area", cancelable: true, buttons: options});
    if (index > -1 && zones && index < zones.length) {
        try {
            await ApiService.startCleaningZonesById([zones[index].id]);
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: 1500});
        } finally {
            window.setTimeout(function() {
                updateHomePage();
            }, 3000);
        }
    } else {
        window.setTimeout(function() {
            updateHomePage();
        }, 3000);
    }
}

async function updateHomePage() {
    loadingBarHome.setAttribute("indeterminate", "indeterminate");

    try {
        let res = await ApiService.getCurrentStatus();
        loadingBarHome.removeAttribute("indeterminate");
        fanspeedButton.removeAttribute("disabled");
        findRobotButton.removeAttribute("disabled");
        spotButton.removeAttribute("disabled");

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
            ["SPOT_CLEANING", "GOING_TO_TARGET", "CLEANING"].indexOf(res.state) != -1) {
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
        robotStateDetailsTime.innerHTML = "Time: " + secondsToHms(res.clean_time);
        fanspeedButton.innerHTML =
            "<ons-icon icon=\"fa-superpowers\"></ons-icon> " +
            (fanspeedPresets[res.fan_power] || `Custom ${res.fan_power}%`);

        currentRefreshTimer =
            window.setTimeout(function() {
                updateHomePage();
            }.bind(this), 5000);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }
}

function secondsToHms(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
}

async function homeInit() {
    /* check for area and go to configuration */
    config = await ApiService.getConfig();
    if (config.spots)
        if (config.spots.length > 0)
            goToButton.removeAttribute("disabled");

    zones = await ApiService.getZones();
    if (zones && zones.length > 0) {
        areaButton.removeAttribute("disabled");
    }

    fanspeedPresets = await ApiService.getFanSpeeds();
    if (fanspeedPresets) {
        fanspeedButton.removeAttribute("disabled");
    }
    updateHomePage();
}

async function homeHide() {
    window.clearTimeout(currentRefreshTimer);
}

window.handleAreaButton = handleAreaButton;
window.handleGoToButton = handleGoToButton;
window.handleControlButton = handleControlButton;
window.handleFanspeedButton = handleFanspeedButton;
window.homeInit = homeInit;
window.homeHide = homeHide;
