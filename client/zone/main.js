import { VacuumMap } from "./js-modules/vacuum-map.js";
const map = new VacuumMap(document.getElementById("experiments"));

/**
 * Calls the goto api route with the currently set goto coordinates
 */
function goto_point(point) {
    fetch("../api/go_to", {
        method: "put",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(point)
    })
    .then(res => res.text())
    .then(console.log);
}

/**
 * Calls the zoned_cleanup api route with the currently set zone
 */
function zoned_cleanup(zones) {
    fetch("../api/start_cleaning_zone_by_coords", {
        method: "put",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(zones)
    })
    .then(res => res.text())
    .then(console.log);
}

document.getElementById("add_zone").onclick = () => {
    map.addZone();
};
document.getElementById("goto").onclick = () => {
    const gotoPoint = map.getLocations().gotoPoints[0];
    if(gotoPoint) goto_point(gotoPoint);
};
document.getElementById("clean").onclick = () => {
    const text = document.getElementById("repeat").innerText;
    const match = /Repeat: (\d+)/g.exec(text);
    const repeatNumber = parseInt(match[1]);

    const zones = map.getLocations().zones.map(zoneCoordinates => [...zoneCoordinates, repeatNumber]);
    zoned_cleanup(zones);
};

document.getElementById("repeat").onclick = () => {
    const text = document.getElementById("repeat").innerText;
    const match = /Repeat: (\d+)/g.exec(text);
    const repeatNumber = parseInt(match[1]);
    document.getElementById("repeat").innerText = `Repeat: ${repeatNumber % 3 + 1}`;
};

fetch("../api/map/latest")
    .then(res => res.json())
    .then(map.initCanvas)
    .then(_ => map.initWebSocket()).catch( e => {
    console.error(e);
});

setInterval(() => {
    const locations = map.getLocations().zones.map((coords, index) =>
        `<div>Zone ${index + 1}: [${coords[0]}, ${coords[1]}, ${coords[2]}, ${coords[3]}]</div>`
    ).join("");
    document.getElementById("zone_console").innerHTML = "<b>Zone coordinates (x1, y1, x2, y2): </b>" + locations;
}, 1000);

