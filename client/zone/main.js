import { VacuumMap } from "./js-modules/vacuum-map.js"
const map = new VacuumMap(document.getElementById('experiments'));

document.getElementById("goto").onclick = () => map.goto_point();
document.getElementById("zone").onclick = () => map.zoned_cleanup();

function fetchmap() {
    fetch("/api/map/latest?doNotTransformPath")
        .then(res => res.json())
        .then(map.updateMap)
        .then(_ => setTimeout(fetchmap, 3000));
}

fetch("/api/map/latest?doNotTransformPath")
    .then(res => res.json())
    .then(map.initCanvas)
    .then(_ => setTimeout(fetchmap, 3000));