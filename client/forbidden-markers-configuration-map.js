/*global ons, fn*/
import {VacuumMap} from "./js/js-modules/vacuum-map.js";
import {ApiService} from "./services/api.service.js";

function markerConfigInit() {
    const map = new VacuumMap(document.getElementById("forbidden-markers-configuration-map"));
    const loadingBarSaveMarkers = document.getElementById("loading-bar-save-markers");
    const saveButton = document.getElementById("forbidden-markers-configuration-save");

    const topPage = fn.getTopPage();
    map.initCanvas(topPage.data.map, {metaData: false, noGotoPoints: true});
    window.fn.map = map;


    const no_go_areas = topPage.data.map.entities.filter(e => e.type === "no_go_area");
    const no_mop_areas = topPage.data.map.entities.filter(e => e.type === "no_mop_area");
    const virtual_walls = topPage.data.map.entities.filter(e => e.type === "virtual_wall");

    if (no_go_areas) {
        no_go_areas.forEach(area => {
            map.addForbiddenZone(area.points, true, true);
        });
    }
    if (no_mop_areas) {
        no_mop_areas.forEach(area => {
            map.addForbiddenMopZone(area.points, true, true);
        });
    }

    if (virtual_walls) {
        virtual_walls.forEach(wall => {
            map.addVirtualWall(wall.points, true, true);
        });
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

    document.getElementById("forbidden-markers-configuration-add-mop-zone")
        .onclick = () => {
            map.addForbiddenMopZone(null, false, true);
        };

    saveButton.onclick = async () => {
        loadingBarSaveMarkers.setAttribute("indeterminate", "indeterminate");
        saveButton.setAttribute("disabled", "disabled");

        try {
            await ApiService.setPersistentData(
                map.getLocations().virtualWalls,
                map.getLocations().forbiddenZones,
                map.getLocations().forbiddenMopZones
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
