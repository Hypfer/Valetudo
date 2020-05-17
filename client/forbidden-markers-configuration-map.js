/*global ons, fn*/
import {VacuumMap} from "./zone/js-modules/vacuum-map.js";
import {ApiService} from "./services/api.service.js";

function markerConfigInit() {
    const map = new VacuumMap(document.getElementById("forbidden-markers-configuration-map"));
    const loadingBarSaveMarkers = document.getElementById("loading-bar-save-markers");
    const saveButton = document.getElementById("forbidden-markers-configuration-save");

    const topPage = fn.getTopPage();
    map.initCanvas(topPage.data.map, {metaData: false, noGotoPoints: true});
    window.fn.map = map;

    if (topPage.data.map.no_go_areas)
        for (let zone of topPage.data.map.no_go_areas) {
            map.addForbiddenZone(
                [zone[0], zone[1], zone[2], zone[3], zone[4], zone[5], zone[6], zone[7]], true,
                true);
        }

    if (topPage.data.map.virtual_walls)
        for (let wall of topPage.data.map.virtual_walls) {
            map.addVirtualWall([wall[0], wall[1], wall[2], wall[3]], true, true);
        }

    document.getElementById("forbidden-markers-configuration-map-page-h1").innerText =
        "Editing markers";

    document.getElementById("forbidden-markers-configuration-add-wall").onclick =
        () => {
            map.addVirtualWall(null, false, true);
        };

    document.getElementById("forbidden-markers-configuration-add-zone")
        .onclick = () => {
            map.addForbiddenZone(null, false, true);
        };

    saveButton.onclick = async () => {
        loadingBarSaveMarkers.setAttribute("indeterminate", "indeterminate");
        saveButton.setAttribute("disabled", "disabled");

        try {
            await ApiService.setPersistentData(
                map.getLocations().virtualWalls,
                map.getLocations().forbiddenZones
            );
            await ons.notification.toast(
                "Successfully saved forbidden markers!",
                {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
            fn.popPage();
        } catch (err) {
            ons.notification.toast(err.message, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            loadingBarSaveMarkers.removeAttribute("indeterminate");
            saveButton.removeAttribute("disabled");
        }
    };
}

window.markerConfigInit = markerConfigInit;