/*global ons */
import {VacuumMap} from "./zone/js-modules/vacuum-map.js";
import {ApiService} from "./services/api.service.js";

const loadingBar = document.getElementById("loading-bar-map");
let map = null;

async function updateMapPage() {
    loadingBar.setAttribute("indeterminate", "indeterminate");
    try {
        let mapData = await ApiService.getLatestMap();
        if (map === null) {
            map = new VacuumMap(document.getElementById("map-canvas"));
            map.initCanvas(mapData);
        } else {
            map.updateMap(mapData);
        }
        map.initWebSocket();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBar.removeAttribute("indeterminate");
    }
}

// Register update function to be accessible outside of es6 module (see <script> below)
window.fn.updateMapPage = updateMapPage;
window.fn.cancelUpdateMap = () => {
    if (map !== null) {
        map.closeWebSocket();
    }
};

/**
 * Calls the goto api route with the currently set goto coordinates
 */
async function goto_point(point) {
    let button = document.getElementById("goto");
    loadingBar.setAttribute("indeterminate", "indeterminate");
    button.setAttribute("disabled", "disabled");
    try {
        await ApiService.goto(point.x, point.y);
        ons.notification.toast("Command successfully sent!",
            {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBar.removeAttribute("indeterminate");
        button.removeAttribute("disabled");
    }
}

/**
 * Calls the zoned_cleanup api route with the currently set zone
 */
async function zoned_cleanup(zones) {
    let button = document.getElementById("start_zoned_cleanup");
    loadingBar.setAttribute("indeterminate", "indeterminate");
    button.setAttribute("disabled", "disabled");
    try {
        await ApiService.startCleaningZoneByCoords(zones);
        ons.notification.toast("Command successfully sent!",
            {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
    } catch (err) {
        ons.notification.toast(
            err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBar.removeAttribute("indeterminate");
        button.removeAttribute("disabled");
    }
}

document.getElementById("goto").onclick = () => {
    const gotoPoint = map.getLocations().gotoPoints[0];
    if (gotoPoint)
        goto_point(gotoPoint);
};
document.getElementById("start_zoned_cleanup").onclick = () => {
    const repeatNumber = 1;
    const zones =
        map.getLocations().zones.map(zoneCoordinates => [...zoneCoordinates, repeatNumber]);
    zoned_cleanup(zones);
};
document.getElementById("add_zone").onclick = () => map.addZone();