/*global ons, fn*/
import {VacuumMap} from "./zone/js-modules/vacuum-map.js";
import {ApiService} from "./services/api.service.js";

let map;
let loadingBarSavespot;
let saveButton;
let renameButton;
let renameDialog;
let renameSpotInput;

let topPage;
let spotConfig;
let spotToModify;

function spotMapInit() {
    map = new VacuumMap(document.getElementById("spot-configuration-map"));
    loadingBarSavespot = document.getElementById("loading-bar-save-spot");
    saveButton = document.getElementById("spot-configuration-save");
    renameButton = document.getElementById("spot-configuration-rename");
    renameDialog = document.getElementById("rename-spot-dialog");
    renameSpotInput = document.getElementById("rename-spot-input");

    topPage = fn.getTopPage();
    spotConfig = topPage.data.spotConfig;
    spotToModify = topPage.data.spotToModify;

    map.initCanvas(topPage.data.map, {metaData: "forbidden"});

    updateSpotName();

    map.addSpot([spotConfig[spotToModify].coordinates[0], spotConfig[spotToModify].coordinates[1]]);

    saveButton.onclick = () => {
        saveSpot(true);
    };

    renameButton.onclick = () => {
        renameSpotInput.value = spotConfig[spotToModify].name;
        renameDialog.show();
    };
}

async function saveSpot(hide) {
    const spotOnMap = map.getLocations().gotoPoints[0];
    spotConfig[spotToModify].coordinates = [spotOnMap.x, spotOnMap.y];

    loadingBarSavespot.setAttribute("indeterminate", "indeterminate");
    saveButton.setAttribute("disabled", "disabled");

    try {
        await ApiService.saveSpots(spotConfig);
        ons.notification.toast(
            "Successfully saved spot!",
            {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
        if (hide) {
            fn.popPage();
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSavespot.removeAttribute("indeterminate");
        saveButton.removeAttribute("disabled");
    }
}

function updateSpotName() {
    document.getElementById("spot-configuration-map-page-h1").innerText =
                  `Editing spot: ${spotConfig[spotToModify].name}`;
}

function hideRenameSpotDialog() {
    renameDialog.hide();
}

function renameSpot() {
    var newSpotName = renameSpotInput.value.trim();
    if (newSpotName === "") {
        ons.notification.toast("Please enter a spot name",
            {buttonLabel: "Dismiss", timeout: 1500});
    } else {
        spotConfig[spotToModify].name = newSpotName;
        renameDialog.hide();
        saveSpot(false);
        updateSpotName();
    }
}

window.hideRenameSpotDialog = hideRenameSpotDialog;
window.renameSpot = renameSpot;
window.spotMapInit = spotMapInit;