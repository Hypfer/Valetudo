/*global ons, fn*/

import {ApiService} from "./services/api.service.js";

let loadingBarZones = document.getElementById("loading-bar-zones");
let zonesList = document.getElementById("zones-list");
let spotList = document.getElementById("spot-list");
let forbiddenZonesItem = document.getElementById("forbidden-zones-item");

/** @type {Array<{id:number, name:string, user: boolean, areas: Array}>} */
let zonesConfig = [];
let spotConfig = [];

async function switchToMapZoneEdit(index) {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    try {
        let mapData = await ApiService.getLatestMap();
        fn.pushPage({
            "id": "zones-configuration-map.html",
            "title": "Zone configuration map",
            "data": {"map": mapData, "zonesConfig": zonesConfig, "zoneToModify": index}
        });
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarZones.removeAttribute("indeterminate");
    }
}

async function switchToMapSpotEdit(index) {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    try {
        let mapData = await ApiService.getLatestMap();
        fn.pushPage({
            "id": "spot-configuration-map.html",
            "title": "Spot configuration map",
            "data": {"map": mapData, "spotConfig": spotConfig, "spotToModify": index}
        });
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarZones.removeAttribute("indeterminate");
    }
}

async function switchToForbiddenMarkersEdit(index) {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    try {
        let mapData = await ApiService.getLatestMap();
        fn.pushPage({
            "id": "forbidden-markers-configuration-map.html",
            "title": "Forbidden markers configuration map",
            "data": {"map": mapData}
        });
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarZones.removeAttribute("indeterminate");
    }
}

function deleteZone(index) {
    zonesConfig.splice(index, 1);
    saveZones();
}

function deleteSpot(index) {
    spotConfig.splice(index, 1);

    saveSpots();
}

async function saveZones() {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.saveZones(zonesConfig);
        generateZonesList();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarZones.removeAttribute("indeterminate");
    }
}

async function saveSpots() {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.saveSpots(spotConfig);
        generateSpotList();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarZones.removeAttribute("indeterminate");
    }
}

function addNewZone() {
    const newZoneName = document.getElementById("add-zone-name").value;

    if (newZoneName.trim() === "") {
        ons.notification.toast("Please enter a zone name",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } else {
        zonesConfig.push({name: newZoneName, areas: []});
    }

    saveZones();
}

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
    Object.values(zonesConfig).forEach((zone, index) => {
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
    Object.values(spotConfig).forEach((spot, index) => {
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

async function ZonesInit() {
    loadingBarZones.setAttribute("indeterminate", "indeterminate");

    /* check for area and go to configuration */
    try {
        zonesConfig = Object.values(await ApiService.getZones());
        generateZonesList();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }

    try {
        spotConfig = await ApiService.getSpots();
        generateSpotList();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }

    /* forbidden zones are not supported by gen 1 vacuums */
    try {
        let robotCapabilities = await ApiService.getRobotCapabilities();
        if (robotCapabilities.includes("CombinedVirtualRestrictionsCapability")) {
            forbiddenZonesItem.hidden = false;
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }

    loadingBarZones.removeAttribute("indeterminate");
}

window.ZonesInit = ZonesInit;
window.switchToMapZoneEdit = switchToMapZoneEdit;
window.switchToMapSpotEdit = switchToMapSpotEdit;
window.switchToForbiddenMarkersEdit = switchToForbiddenMarkersEdit;
window.deleteZone = deleteZone;
window.deleteSpot = deleteSpot;
window.addNewZone = addNewZone;
window.addNewSpot = addNewSpot;

