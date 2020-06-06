/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsInfoPage() {
    var loadingBarSettingsInfo = document.getElementById("loading-bar-settings-info");

    loadingBarSettingsInfo.setAttribute("indeterminate", "indeterminate");
    try {
        let fwRes = await ApiService.getFWVersion();
        document.getElementById("info_fw_version").innerText = fwRes.version;
        document.getElementById("info_valetudo_version").innerText = fwRes.valetudoVersion;

        let modelRes = await ApiService.getModel();
        document.getElementById("info_device_model_identifier").innerText = modelRes.identifier;
        document.getElementById("info_device_model_manufacturer").innerText = modelRes.manufacturer;
        document.getElementById("info_device_model_name").innerText = modelRes.name;


        document.getElementById("info_timezone").innerText = await ApiService.getTimezone();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsInfo.removeAttribute("indeterminate");
    }
}

async function checkNewValetudoVersion() {
    var loadingBarSettingsInfo = document.getElementById("loading-bar-settings-info");

    loadingBarSettingsInfo.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await fetch("https://api.github.com/repos/Hypfer/Valetudo/releases", {method: "GET"});
        if (!res.ok) {
            throw Error(await res.text());
        }
        let json = await res.json();
        let info_valetudo_newest_release = json[0];
        document.getElementById("info_newest_valetudo_version").innerHTML =
            info_valetudo_newest_release.tag_name;
        document.getElementById("info_valetudo_update_url").innerHTML =
            "<a href=\"" + info_valetudo_newest_release.html_url + "\">" +
            info_valetudo_newest_release.html_url + "</a>";
        if (document.getElementById("info_valetudo_version").innerHTML !=
            info_valetudo_newest_release.tag_name) {
            document.getElementById("info_valetudo_update_url_list").style.display =
                ""; // make entry visible if newer version is availiable
        }
    } catch (err) {
        ons.notification.toast(err.message, {buttonLabel: "Dismiss", timeout: 1500});
    } finally {
        loadingBarSettingsInfo.removeAttribute("indeterminate");
    }
}

window.updateSettingsInfoPage = updateSettingsInfoPage;
window.checkNewValetudoVersion = checkNewValetudoVersion;
