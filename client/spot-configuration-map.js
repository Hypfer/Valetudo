/*eslint-env browser*/
/*global ons, fn*/
import {VacuumMap} from "./zone/js-modules/vacuum-map.js";
const map = new VacuumMap(document.getElementById("spot-configuration-map"));
const loadingBarSavespot = document.getElementById("loading-bar-save-spot");
const saveButton = document.getElementById("spot-configuration-save");
const renameButton = document.getElementById("spot-configuration-rename");
const renameDialog = document.getElementById("rename-spot-dialog");
const renameSpotInput = document.getElementById("rename-spot-input");

const topPage = fn.getTopPage();
const spotConfig = topPage.data.spotConfig;
const spotToModify = topPage.data.spotToModify;

map.initCanvas(topPage.data.map, {metaData: "forbidden"});

updateSpotName();
console.log(map);
map.addSpot([spotConfig[spotToModify].coordinates[0], spotConfig[spotToModify].coordinates[1]]);

saveButton.onclick = () => {
    saveSpot(true);
};

renameButton.onclick =
    () => {
        renameSpotInput.value = spotConfig[spotToModify].name;
        renameDialog.show();
    };

function saveSpot(hide) {
    const spotOnMap = map.getLocations().gotoPoints[0];
    spotConfig[spotToModify].coordinates = [spotOnMap.x, spotOnMap.y];

    loadingBarSavespot.setAttribute("indeterminate", "indeterminate");
    saveButton.setAttribute("disabled", "disabled");
    fn.requestWithPayload("api/spots", JSON.stringify(spotConfig), "PUT", function(err) {
        loadingBarSavespot.removeAttribute("indeterminate");
        saveButton.removeAttribute("disabled");
        if (err) {
            ons.notification.toast(
                err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            ons.notification.toast(
                "Successfully saved spot!",
                {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
            if (hide)
                fn.popPage();
        }
    });
}

function
updateSpotName() {
    document.getElementById("spot-configuration-map-page-h1").innerText =
                  `Editing spot: ${spotConfig[spotToModify].name}`;
}

function
hideRenameSpotDialog() {
    renameDialog.hide();
}

function
renameSpot() {
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
