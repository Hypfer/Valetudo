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

var zonesSelectDialog = null;

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
        buttons: [...Object.keys(fanspeedPresets), {label: "Cancel", icon: "md-close"}]
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

async function handleZonesCancelButton() {
    zonesSelectDialog.hide();
}

async function handleZonesStartButton() {
    let checkboxes = document.getElementsByClassName("zone-select-checkbox");
    let zoneIds = [];
    Array.prototype.forEach.call(checkboxes, function(element) {
        if (element.checked === true) {
            zoneIds.push(parseInt(element.getAttribute("zone-id")));
        }
    });

    if (zoneIds.length > 0) {
        try {
            await ApiService.startCleaningZonesById(zoneIds);
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
    zonesSelectDialog.hide();
}

async function handleZonesButton() {
    /* remove old dialog before creating new one */
    if (zonesSelectDialog !== null) {
        zonesSelectDialog.remove();
    }

    let zoneItems = "";
    zones.forEach((zone, index) => {
        zoneItems += `
            <ons-list-item tappable style="margin-bottom:0;">
                <label class="left">
                    <ons-checkbox input-id="zone-${zone.id}" zone-id="${zone.id}" 
                        class="zone-select-checkbox"></ons-checkbox>
                </label>
                <label for="zone-${zone.id}" class="center">${zone.name}</label>
            </ons-list-item>`;
    });
    let maxHeight = document.body.clientHeight - 200;
    let dialog = `
        <ons-dialog id="zone-clean-select" cancelable>
            <ons-list-title style="">Select zones</ons-list-title>
            <ons-list id="zone-list" style="overflow-y: auto; max-height: ${maxHeight}px">
                ${zoneItems}
            </ons-list>
            <ons-list-item>
                <ons-button class="button" onclick="handleZonesCancelButton()"
                    style="width:45%; margin-right:5%;" modifier="outline">Cancel</ons-button>
                <ons-button class="button" onclick="handleZonesStartButton()" 
                    style="width:45%;"><ons-icon icon="fa-play" 
                    class="ons-icon fa-play fa"></ons-icon> Start</ons-button>
            </ons-list-item>
        </ons-dialog>`;

    zonesSelectDialog = ons.createElement(dialog, {append: true});
    zonesSelectDialog.show();
}

async function updateHomePage() {
    loadingBarHome.setAttribute("indeterminate", "indeterminate");

    try {
        let res = await ApiService.getVacuumState();
        loadingBarHome.removeAttribute("indeterminate");
        fanspeedButton.removeAttribute("disabled");
        findRobotButton.removeAttribute("disabled");
        spotButton.removeAttribute("disabled");

        const buttonMap = {
            start: startButton,
            pause: pauseButton,
            stop: stopButton,
            home: homeButton,
            spot: spotButton,
            find: findRobotButton,
            go_to: goToButton,
            zones: areaButton
        };

        const buttonStateMap = { //true = enabled
            start: true,
            pause: true,
            stop: true,
            home: true,
            spot: true,
            find: true,
            go_to: true,
            zones: true
        };

        var BatteryStateAttribute = res.find(e => e.__class === "BatteryStateAttribute");
        var StatusStateAttribute = res.find(e => e.__class === "StatusStateAttribute");
        var AreaCleanupStatsAttribute = res.find(e => e.__class === "LatestCleanupStatisticsAttribute" && e.type === "area");
        var DurationCleanupStatsAttribute = res.find(e => e.__class === "LatestCleanupStatisticsAttribute" && e.type === "duration");
        var FanSpeedStateAttribute = res.find(e => e.__class === "FanSpeedStateAttribute");

        if (BatteryStateAttribute) {
            batteryStatusText.innerText = "Battery: " + BatteryStateAttribute.level + "%";
            batteryStatusBar.value = BatteryStateAttribute.level;
        }

        if (StatusStateAttribute) {
            robotState.innerText = StatusStateAttribute.value;

            if (StatusStateAttribute.flag !== "none") {
                robotState.innerText += " " + StatusStateAttribute.flag;
            }

            if (StatusStateAttribute.value === "error") {
                robotState.innerHTML +=
                    "<span class=\"robot-error\"><ons-icon icon=\"fa-exclamation-triangle\"></ons-icon> " +
                    StatusStateAttribute.metaData.error_description +
                    " <ons-icon icon=\"fa-exclamation-triangle\"></ons-icon></span>";

            }

            switch (StatusStateAttribute.value) {
                case "docked":
                    buttonStateMap.pause = false;
                    buttonStateMap.stop = false;
                    buttonStateMap.home = false;
                    buttonStateMap.spot = false;
                    break;
                case "idle":
                    buttonStateMap.pause = false;
                    buttonStateMap.stop = false;
                    break;
                case "returning":
                    buttonStateMap.start = false;
                    buttonStateMap.pause = false;
                    buttonStateMap.home = false;
                    buttonStateMap.go_to = false;
                    break;
                case "cleaning":
                    buttonStateMap.start = false;
                    buttonStateMap.home = false;
                    buttonStateMap.spot = false;
                    buttonStateMap.go_to = false;
                    break;
                case "paused":
                    buttonStateMap.pause = false;
                    break;
            }
        }

        if (AreaCleanupStatsAttribute) {
            robotStateDetailsM2.innerHTML = "Area: " +
                ("00" + (AreaCleanupStatsAttribute.value / 10000).toFixed(2)).slice(-6) + " m²";
        }

        if (DurationCleanupStatsAttribute) {
            robotStateDetailsTime.innerHTML = "Time: " + secondsToHms(DurationCleanupStatsAttribute.value);
        }

        if (FanSpeedStateAttribute) {
            fanspeedButton.innerHTML = "<ons-icon icon=\"fa-superpowers\"></ons-icon> ";

            if (FanSpeedStateAttribute.value === "custom") {
                fanspeedButton.innerHTML += `Custom ${FanSpeedStateAttribute.customValue}%`;
            } else {
                fanspeedButton.innerHTML += FanSpeedStateAttribute.value;
            }
        }

        Object.keys(buttonStateMap).forEach(k => {
            const button = buttonMap[k];

            if (buttonStateMap[k]) {
                button.removeAttribute("disabled");
            } else {
                button.setAttribute("disabled", "disabled");
            }
        });

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
    if (config.spots) {
        if (config.spots.length > 0) {
            goToButton.removeAttribute("disabled");
        }
    }

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

window.handleZonesButton = handleZonesButton;
window.handleZonesStartButton = handleZonesStartButton;
window.handleZonesCancelButton = handleZonesCancelButton;
window.handleGoToButton = handleGoToButton;
window.handleControlButton = handleControlButton;
window.handleFanspeedButton = handleFanspeedButton;
window.homeInit = homeInit;
window.homeHide = homeHide;
