/*global ons, fn*/
let loadingBarZones = document.getElementById("loading-bar-zones");
let zonesList = document.getElementById("zones-list");
let spotList = document.getElementById("spot-list");

/** @type {Array<{id:number, name:string, user: boolean, areas: Array}>} */
let zonesConfig = [];
let spotConfig = [];

// eslint-disable-next-line no-unused-vars
function switchToMapZoneEdit(index) {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    fn.request("api/map/latest", "GET", function(err, mapData) {
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
        loadingBarZones.removeAttribute("indeterminate");

        fn.pushPage({
            "id": "zones-configuration-map.html",
            "title": "Zone configuration map",
            "data": {"map": mapData, "zonesConfig": zonesConfig, "zoneToModify": index}
        });
    });
}

// eslint-disable-next-line no-unused-vars
function switchToMapSpotEdit(index) {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    fn.request("api/map/latest", "GET", function(err, mapData) {
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
        loadingBarZones.removeAttribute("indeterminate");

        fn.pushPage({
            "id": "spot-configuration-map.html",
            "title": "Spot configuration map",
            "data": {"map": mapData, "spotConfig": spotConfig, "spotToModify": index}
        });
    });
}

// eslint-disable-next-line no-unused-vars
function switchToForbiddenMarkersEdit(index) {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    fn.request("api/map/latest", "GET", function(err, mapData) {
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
        loadingBarZones.removeAttribute("indeterminate");

        fn.pushPage({
            "id": "forbidden-markers-configuration-map.html",
            "title": "Forbidden markers configuration map",
            "data": {"map": mapData}
        });
    });
}

// eslint-disable-next-line no-unused-vars
function deleteZone(index) {
    zonesConfig.splice(index, 1);
    saveZones();
}

// eslint-disable-next-line no-unused-vars
function deleteSpot(index) {
    spotConfig.splice(index, 1);

    saveSpots();
}

function saveZones() {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");

    fn.requestWithPayload("api/zones", JSON.stringify(zonesConfig), "PUT", function(err) {
        loadingBarZones.removeAttribute("indeterminate");
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            generateZonesList();
        }
    });
}

function saveSpots() {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");

    fn.requestWithPayload("api/spots", JSON.stringify(spotConfig), "PUT", function(err) {
        loadingBarZones.removeAttribute("indeterminate");
        if (err) {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } else {
            generateSpotList();
        }
    });
}

// eslint-disable-next-line no-unused-vars
function addNewZone() {
    const newZoneName = document.getElementById("add-zone-name").value;

    if (newZoneName.trim() === "") {
        ons.notification.toast("Please enter a zone name",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } else {
        const id = Math.min(...zonesConfig.map(v => v.id)) - 1;
        zonesConfig.push({id, name: newZoneName, areas: [], user: true});
    }

    saveZones();
}

// eslint-disable-next-line no-unused-vars
function addNewSpot() {
    const newSpotName = document.getElementById("add-spot-name").value;

    if (newSpotName.trim() === "") {
        ons.notification.toast("Please enter a spot name",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } else {
        spotConfig.push({name: newSpotName, coordinates: [25000, 25000]});
    }

    saveSpots();
}

function generateZonesList() {
    let out = "";
    zonesConfig.forEach((zone, index) => {
        if (!zone.user) return;
        out += `
                    <ons-list-item tappable class="locations-list-item" onclick="switchToMapZoneEdit(${
    index})">
                        <label>
                            <ons-icon icon="edit"></ons-icon>
                        </label>
                        <label>
                            ${zone.name}
                        </label>
                        <ons-button class="button-delete" onclick="event.stopPropagation(); deleteZone(${
    index});"><ons-icon icon="fa-trash"></ons-icon> Delete</ons-button>
                    </ons-list-item>
                `;
    });

    out += `
                <ons-list-item class="locations-list-item">
                    <label>
                        <ons-icon icon="edit"></ons-icon>
                    </label>
                    <ons-input id="add-zone-name" placeholder="Enter name for zone ...">

                    </ons-input>
                    <ons-button class="delete-button-right" onclick="addNewZone()"><ons-icon icon="fa-plus"></ons-icon> Add</ons-button>
                </ons-list-item>
            `;

    zonesList.innerHTML = out;
}

function generateSpotList() {
    let out = "";
    spotConfig.forEach((spot, index) => {
        out += `
                    <ons-list-item tappable class="locations-list-item" onclick="switchToMapSpotEdit(${
    index})">
                        <label>
                            <ons-icon icon="edit"></ons-icon>
                        </label>
                        <label>
                            ${spot.name}
                        </label>
                        <ons-button class="button-delete" onclick="event.stopPropagation(); deleteSpot(${
    index});"><ons-icon icon="fa-trash"></ons-icon> Delete</ons-button>
                    </ons-list-item>
                `;
    });

    out += `
                <ons-list-item class="locations-list-item">
                    <label>
                        <ons-icon icon="edit"></ons-icon>
                    </label>
                    <ons-input id="add-spot-name" placeholder="Enter name for spot ...">

                    </ons-input>
                    <ons-button class="delete-button-right" onclick="addNewSpot()"><ons-icon icon="fa-plus"></ons-icon> Add</ons-button>
                </ons-list-item>
            `;

    spotList.innerHTML = out;
}

ons.getScriptPage().onShow = function() {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");

    /* check for area and go to configuration */

    const getZones =
        fetch("api/zones")
            .then(res => res.json())
            .then(res => {
                zonesConfig = res;
                generateZonesList();
            })
            .catch(err => {
                console.error(err);
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            });
    const getSpots =
        fetch("api/spots")
            .then(res => res.json())
            .then(res => {
                spotConfig = res;
                generateSpotList();
            })
            .catch(err => {
                console.error(err);
                ons.notification.toast(
                    err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
            });

    Promise.all([getZones, getSpots])
        .then(_ => {
            loadingBarZones.removeAttribute("indeterminate");
        });
};
