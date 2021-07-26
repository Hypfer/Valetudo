/*global ons */

import { ApiService } from "./services/api.service.js";

var currentRefreshTimer;

var startButton = document.getElementById("start-button");
var pauseButton = document.getElementById("pause-button");
var stopButton = document.getElementById("stop-button");
var spotButton = document.getElementById("spot-button");
var goToButton = document.getElementById("go-to-button");
var areaButton = document.getElementById("area-button");
var segmentsButton = document.getElementById("segments-button");
var fanspeedButton = document.getElementById("fanspeed-button");
var watergradeButton = document.getElementById("watergrade-button");
var findRobotButton = document.getElementById("find-robot-button");
var homeButton = document.getElementById("home-button");
var batteryStatusText = document.getElementById("battery-status-text");
var batteryStatusBar = document.getElementById("battery-status-bar");
var robotState = document.getElementById("robot-state");
var robotStateDetailsM2 = document.getElementById("robot-state-details-m2");
var robotStateDetailsTime = document.getElementById("robot-state-details-time");
var loadingBarHome = document.getElementById("loading-bar-home");


/** @type {Array<{id:number, name:string}>} */
var zones = [];
/** @type {Array<{id:number, name:string}>} */
var segments = [];
/** @type {{[id: string]: string}} */
var fanspeedPresets = {};

var waterGradePresets = {};

var spots = [];

var zonesSelectDialog = null;
var segmentsSelectDialog = null;

if (!ons.platform.isAndroid()) {
    var progressStyle = document.querySelectorAll(".progressStyle");
    for (let progress of progressStyle) { // How Why Help
        progress.hasAttribute("modifier") ?
            progress.setAttribute("modifier", progress.getAttribute("modifier") + " ios") :
            progress.setAttribute("modifier", "ios");
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
                // noinspection ExceptionCaughtLocallyJS
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

    var level = Object.values(fanspeedPresets)[index];

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

async function handleWaterGradeButton() {
    window.clearTimeout(currentRefreshTimer);

    let index = await ons.openActionSheet({
        title: "Select water grade",
        cancelable: true,
        buttons: [...Object.values(waterGradePresets), {label: "Cancel", icon: "md-close"}]
    });

    var level = Object.values(waterGradePresets)[index];

    if (level) {
        loadingBarHome.setAttribute("indeterminate", "indeterminate");
        watergradeButton.setAttribute("disabled", "disabled");
        try {
            await ApiService.setWaterGrade(level);
            window.clearTimeout(currentRefreshTimer);
            window.setTimeout(function() {
                updateHomePage();
            }, 150);
        } catch (err) {
            watergradeButton.removeAttribute("disabled");
            loadingBarHome.removeAttribute("indeterminate");
            ons.notification.toast(err.message,{buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
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

    for (var i = 0; i < spots.length; i++) {
        options.push(spots[i].name);
    }

    options.push({label: "Cancel", icon: "md-close"});

    let index = await ons.openActionSheet({title: "Go to", cancelable: true, buttons: options});
    if (index > -1 && index < spots.length) {
        try {
            await ApiService.goto(spots[index].coordinates[0], spots[index].coordinates[1]);
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
            zoneIds.push(element.getAttribute("zone-id"));
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

async function handleSegmentsCancelButton() {
    segmentsSelectDialog.hide();
}

async function handleSegmentsStartButton() {
    let checkboxes = document.getElementsByClassName("segment-select-checkbox");
    let segmentIds = [];
    Array.prototype.forEach.call(checkboxes, function(element) {
        if (element.checked === true) {
            segmentIds.push(element.getAttribute("segment-id"));
        }
    });

    if (segmentIds.length > 0) {
        try {
            await ApiService.startCleaningSegments(segmentIds);
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
    segmentsSelectDialog.hide();
}

async function handleSegmentsButton() {
    /* remove old dialog before creating new one */
    if (segmentsSelectDialog !== null) {
        segmentsSelectDialog.remove();
    }

    let segmentItems = "";
    segments.forEach((segment, index) => {
        segmentItems += `
            <ons-list-item tappable style="margin-bottom:0;">
                <label class="left">
                    <ons-checkbox input-id="segment-${segment.id}" segment-id="${segment.id}"
                        class="segment-select-checkbox"></ons-checkbox>
                </label>
                <label for="segment-${segment.id}" class="center">${segment.name}</label>
            </ons-list-item>`;
    });
    let maxHeight = document.body.clientHeight - 200;
    let dialog = `
        <ons-dialog id="segment-clean-select" cancelable>
            <ons-list-title style="">Select segments</ons-list-title>
            <ons-list id="segment-list" style="overflow-y: auto; max-height: ${maxHeight}px">
                ${segmentItems}
            </ons-list>
            <ons-list-item>
                <ons-button class="button" onclick="handleSegmentsCancelButton()"
                    style="width:45%; margin-right:5%;" modifier="outline">Cancel</ons-button>
                <ons-button class="button" onclick="handleSegmentsStartButton()"
                    style="width:45%;"><ons-icon icon="fa-play"
                    class="ons-icon fa-play fa"></ons-icon> Start</ons-button>
            </ons-list-item>
        </ons-dialog>`;

    segmentsSelectDialog = ons.createElement(dialog, {append: true});
    segmentsSelectDialog.show();
}

async function updateHomePage() {
    loadingBarHome.setAttribute("indeterminate", "indeterminate");

    try {
        const vacuumState = await ApiService.getVacuumState();
        const robotCapabilities = await ApiService.getCapabilities() || [];
        loadingBarHome.removeAttribute("indeterminate");
        fanspeedButton.removeAttribute("disabled");
        watergradeButton.removeAttribute("disabled");

        const buttonMap = {
            start: startButton,
            pause: pauseButton,
            stop: stopButton,
            home: homeButton,
            spot: spotButton,
            find: findRobotButton,
            go_to: goToButton,
            zones: areaButton,
            segments: segmentsButton
        };

        const buttonStateMap = { //true = enabled
            start: robotCapabilities.includes("BasicControlCapability"),
            pause: robotCapabilities.includes("BasicControlCapability"),
            stop: robotCapabilities.includes("BasicControlCapability"),
            home: robotCapabilities.includes("BasicControlCapability"),
            spot: false, // not ported to capability, discussed @Hypfer to disable it for now
            find: robotCapabilities.includes("LocateCapability"),
            go_to: robotCapabilities.includes("GoToLocationCapability"),
            zones: robotCapabilities.includes("ZoneCleaningCapability"),
            segments: robotCapabilities.includes("MapSegmentationCapability")
        };

        var BatteryStateAttribute = vacuumState.find(e => e.__class === "BatteryStateAttribute");
        var StatusStateAttribute = vacuumState.find(e => e.__class === "StatusStateAttribute");
        var AreaCleanupStatsAttribute = vacuumState.find(e => e.__class === "LatestCleanupStatisticsAttribute" && e.type === "area");
        var DurationCleanupStatsAttribute = vacuumState.find(e => e.__class === "LatestCleanupStatisticsAttribute" && e.type === "duration");
        var FanSpeedStateAttribute = vacuumState.find(e => e.__class === "PresetSelectionStateAttribute" && e.type === "fan_speed");
        var WaterGradeStateAttribute = vacuumState.find(e => e.__class === "PresetSelectionStateAttribute" && e.type === "water_grade");

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
                    buttonStateMap.home = false;
                    buttonStateMap.go_to = false;
                    buttonStateMap.zones = false;
                    buttonStateMap.segments = false;
                    break;
                case "cleaning":
                    buttonStateMap.start = false;
                    buttonStateMap.home = false;
                    buttonStateMap.spot = false;
                    buttonStateMap.go_to = false;
                    buttonStateMap.zones = false;
                    buttonStateMap.segments = false;
                    break;
                case "paused":
                    buttonStateMap.stop = false;
                    break;
            }
        }

        if (AreaCleanupStatsAttribute) {
            robotStateDetailsM2.hidden = false;
            robotStateDetailsM2.innerHTML = "Area: " +
                ("00" + (AreaCleanupStatsAttribute.value / 10000).toFixed(2)).slice(-6) + " m²";
        } else {
            robotStateDetailsM2.hidden = true;
        }

        if (DurationCleanupStatsAttribute) {
            robotStateDetailsTime.hidden = false;
            robotStateDetailsTime.innerHTML = "Time: " + secondsToHms(DurationCleanupStatsAttribute.value);
        } else {
            robotStateDetailsTime.hidden = true;
        }

        if (FanSpeedStateAttribute) {
            fanspeedButton.innerHTML = "<ons-icon icon=\"fa-superpowers\"></ons-icon> ";

            if (FanSpeedStateAttribute.value === "custom") {
                fanspeedButton.innerHTML += `Custom ${FanSpeedStateAttribute.customValue}%`;
            } else {
                fanspeedButton.innerHTML += FanSpeedStateAttribute.value;
            }
        }

        if (WaterGradeStateAttribute) {
            watergradeButton.innerHTML = "<ons-icon icon=\"fa-tint\"></ons-icon> ";

            if (WaterGradeStateAttribute.value === "custom") {
                watergradeButton.innerHTML += `Custom ${WaterGradeStateAttribute.customValue}%`;
            } else {
                watergradeButton.innerHTML += WaterGradeStateAttribute.value;
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

    try {
        spots = await ApiService.getSpots();
    } catch (e) {
        spots = [];
    }


    if (spots) {
        if (spots.length > 0) {
            goToButton.removeAttribute("disabled");
        }
    }

    
    try {
        zones = await ApiService.getZones();
    } catch (e) {
        zones = [];
    }

    if (zones && Object.values(zones).length > 0) {
        areaButton.removeAttribute("disabled");
    }


    try {
        segments = await ApiService.getSegments().then((res) => res.filter((segment) => !!segment.name));
    } catch (e) {
        segments = [];
    }

    if (segments && Object.values(segments).length > 0) {
        segmentsButton.removeAttribute("disabled");
    }

    fanspeedPresets = await ApiService.getFanSpeeds();
    if (fanspeedPresets) {
        fanspeedButton.removeAttribute("disabled");
    }

    let capabilities = await ApiService.getCapabilities();
    if (Array.isArray(capabilities) && capabilities.includes("WaterUsageControlCapability")) {
        waterGradePresets = await ApiService.getWaterGradePresets();

        if (waterGradePresets) {
            watergradeButton.style.display = "";
            watergradeButton.removeAttribute("disabled");
        }
    }


    updateHomePage();
}

async function homeHide() {
    window.clearTimeout(currentRefreshTimer);
}

window.handleZonesButton = handleZonesButton;
window.handleZonesStartButton = handleZonesStartButton;
window.handleZonesCancelButton = handleZonesCancelButton;
window.handleSegmentsButton = handleSegmentsButton;
window.handleSegmentsStartButton = handleSegmentsStartButton;
window.handleSegmentsCancelButton = handleSegmentsCancelButton;
window.handleGoToButton = handleGoToButton;
window.handleControlButton = handleControlButton;
window.handleFanspeedButton = handleFanspeedButton;
window.handleWaterGradeButton = handleWaterGradeButton;
window.homeInit = homeInit;
window.homeHide = homeHide;
