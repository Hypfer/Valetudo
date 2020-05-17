/*global ons */
import {ApiService} from "./services/api.service.js";

async function updateSettingsInfoPage() {
    var loadingBarSettingsInfo = document.getElementById("loading-bar-settings-info");

    loadingBarSettingsInfo.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getFWVersion();
        document.getElementById("info_fw_version").innerHTML = res.version;
        document.getElementById("info_fw_build").innerHTML = res.build;
        document.getElementById("info_valetudo_version").innerHTML = res.valetudoVersion;
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsInfo.removeAttribute("indeterminate");
        updateAppLocale();
    }
}
async function updateAppLocale() {
    var loadingBarSettingsInfo = document.getElementById("loading-bar-settings-info");

    loadingBarSettingsInfo.setAttribute("indeterminate", "indeterminate");
    try {
        let appLocale = await ApiService.getAppLocale();
        document.getElementById("app_locale_name").innerHTML = appLocale.name;
        document.getElementById("app_locale_bom").innerHTML = appLocale.bom;
        document.getElementById("app_locale_location").innerHTML = appLocale.location;
        document.getElementById("app_locale_language").innerHTML = appLocale.language;
        document.getElementById("app_locale_timezone").innerHTML = appLocale.timezone;
        document.getElementById("app_locale_logserver").innerHTML = appLocale.logserver;
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
