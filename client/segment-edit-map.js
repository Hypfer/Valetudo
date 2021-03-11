/*global ons, fn*/
import {VacuumMap} from "./js/js-modules/vacuum-map.js";
import {ApiService} from "./services/api.service.js";

function segmentConfigInit() {
    const map = new VacuumMap(document.getElementById("segment-edit-map"));
    const loadingBarSegmentEdit = document.getElementById("loading-bar-segment-edit");

    const topPage = fn.getTopPage();
    const mapData = JSON.parse(JSON.stringify(topPage.data.map)); //cloned for good measure

    mapData.layers.forEach(layer => {
        if (layer.type === "segment") {
            layer.metaData.active = false;
        }
    });

    map.initCanvas(mapData, {metaData: "segments", noGotoPoints: true, noPath: true});
    window.fn.map = map;

    document.getElementById("segment-edit-map-page-h1").innerText = "Editing Segments";

    document.getElementById("segment-edit-add-split-line").onclick = () => {
        if (map.getLocations().virtualWalls.length === 0) {
            map.addVirtualWall(null, false, true);
        } else {
            ons.notification.toast("There can only be one split line.",{buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    };

    document.getElementById("segment-edit-split").onclick = async () => {
        let locations = map.getLocations();

        if (locations.selectedSegments.length === 1) {
            if (locations.virtualWalls.length === 1) {
                loadingBarSegmentEdit.setAttribute("indeterminate", "indeterminate");

                try {
                    await ApiService.splitSegment(
                        {
                            x: locations.virtualWalls[0][0],
                            y: locations.virtualWalls[0][1]
                        },
                        {
                            x: locations.virtualWalls[0][2],
                            y: locations.virtualWalls[0][3]
                        },
                        locations.selectedSegments[0].id
                    );
                    await ons.notification.toast(
                        "Successfully split segment!",
                        {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
                    fn.popPage();
                } catch (err) {
                    ons.notification.toast(err.message, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                } finally {
                    loadingBarSegmentEdit.removeAttribute("indeterminate");
                }
            } else {
                ons.notification.toast("You need to have a split line to split",{buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            }
        } else {
            ons.notification.toast("You need to select exactly one segment to execute a split",{buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    };

    document.getElementById("segment-edit-join").onclick = async () => {
        let locations = map.getLocations();

        if (locations.selectedSegments.length === 2) {
            loadingBarSegmentEdit.setAttribute("indeterminate", "indeterminate");

            try {
                await ApiService.joinSegments(
                    locations.selectedSegments[0].id,
                    locations.selectedSegments[1].id
                );
                await ons.notification.toast(
                    "Successfully joined segment!",
                    {buttonLabel: "Dismiss", timeout: window.fn.toastOKTimeout});
                fn.popPage();
            } catch (err) {
                ons.notification.toast(err.message, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            } finally {
                loadingBarSegmentEdit.removeAttribute("indeterminate");
            }
        } else {
            ons.notification.toast("You need to select exactly two segment to execute a join",{buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    };
}

window.segmentConfigInit = segmentConfigInit;
