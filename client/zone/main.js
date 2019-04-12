import { VacuumMap } from "./js-modules/vacuum-map.js"
const map = new VacuumMap(document.getElementById('experiments'));
const dimension_mm = 50 * 1024
/**
 * Calls the goto api route with the currently set goto coordinates
 */
function goto_point(point) {
    fetch("../api/go_to", {
        method: "put",
        headers: {
            'Content-Type': 'application/json'
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
    fetch("../api/start_cleaning_zone", {
        method: "put",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(zones)
    })
    .then(res => res.text())
    .then(console.log);
}

function calculate_locations(coords, index){
    let zones = [-1,-1,-1,-1]
    zones[0] = coords[0];
    zones[1] = dimension_mm - coords[1];
    zones[2] = coords[2];
    zones[3] = dimension_mm - coords[3];
    if(zones[0]>zones[2]){
      let tmp = zones[0];
      zones[0] = zones[2];
      zones[2] = tmp;
   }
   if(zones[1]>zones[3]){
     let tmp = zones[1];
     zones[1] = zones[3];
     zones[3] = tmp;
  }
  return `<div>Zone ${index + 1}: [${coords[0]}, ${coords[1]}, ${coords[2]}, ${coords[3]}]</div><div>ZoneXiaomi: ${index +1 }: [${zones[0]}, ${zones[1]}, ${zones[2]}, ${zones[3]}]</div>`;
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
    const locations = map.getLocations().zones.map((coords, index) => calculate_locations(coords, index)).join("");
    document.getElementById("zone_console").innerHTML = "<b>Zone coordinates (x1, y1, x2, y2): </b>" + locations;
}, 1000);
