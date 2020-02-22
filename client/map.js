
import {VacuumMap} from "./zone/js-modules/vacuum-map.js"
const loadingBar = document.getElementById("loading-bar-map");
let map = null;

function updateMapPage() {
    loadingBar.setAttribute("indeterminate", "indeterminate");
    fn.request("api/map/latest", "GET", function(err, mapData) {
        loadingBar.removeAttribute("indeterminate");
        if (!err) {
            if (map === null) {
                map = new VacuumMap(document.getElementById("map-canvas"));
                map.initCanvas(mapData);
            } else {
                map.updateMap(mapData);
            }
            map.initWebSocket();
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    })
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
function goto_point(point) {
    let button = document.getElementById("goto");
    loadingBar.setAttribute("indeterminate", "indeterminate");
    button.setAttribute("disabled", "disabled");
    fn.requestWithPayload("api/go_to", JSON.stringify(point), "PUT", function(err) {
        loadingBar.removeAttribute("indeterminate");
        button.removeAttribute("disabled");
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            ons.notification.toast("Command successfully sent!",
                {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
        }
    });
}

/**
 * Calls the zoned_cleanup api route with the currently set zone
 */
function zoned_cleanup(zones) {
    let button = document.getElementById("start_zoned_cleanup");
    loadingBar.setAttribute("indeterminate", "indeterminate");
    button.setAttribute("disabled", "disabled");
    fn.requestWithPayload(
        "api/start_cleaning_zone_by_coords", JSON.stringify(zones), "PUT", function(err) {
            loadingBar.removeAttribute("indeterminate");
            button.removeAttribute("disabled");
            if (err) {
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } else {
                ons.notification.toast("Command successfully sent!",
                    {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
            }
        });
}

document.getElementById("goto").onclick = () => {
    const gotoPoint = map.getLocations().gotoPoints[0];
    if (gotoPoint)
        goto_point(gotoPoint);
} document.getElementById("start_zoned_cleanup").onclick = () => {
    const repeatNumber = 1;
    const zones =
        map.getLocations().zones.map(zoneCoordinates => [...zoneCoordinates, repeatNumber]);
    zoned_cleanup(zones);
} document.getElementById("add_zone").onclick = () => map.addZone();