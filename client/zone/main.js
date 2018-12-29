import { VacuumMap } from "./js-modules/vacuum-map.js"
var map = new VacuumMap(document.getElementById('experiments'));

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