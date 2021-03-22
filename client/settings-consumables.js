/*global ons */
import {ApiService} from "./services/api.service.js";

async function handleConsumableResetButton(type, subType) {
    var loadingBarSettingsConsumables = document.getElementById("loading-bar-settings-consumables");

    let answer = await ons.notification.confirm("Do you really want to reset this consumable?");
    if (answer === 1) {
        loadingBarSettingsConsumables.setAttribute("indeterminate", "indeterminate");
        try {
            await ApiService.resetConsumable(type, subType);
            updateSettingsConsumablesPage();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            loadingBarSettingsConsumables.removeAttribute("indeterminate");
        }
    }
}

function setConsumableData(element, res, type, subType) {
    const data = res.find(e => e.type === type && e.subType === subType);
    if (data) {
        element.innerHTML = (data.remaining.value / 60).toFixed(1) + " hours left";
    } else {
        element.innerHTML = "N/A";
    }
}

async function updateSettingsConsumablesPage() {
    var loadingBarSettingsConsumables = document.getElementById("loading-bar-settings-consumables");
    var consumableMainBrushStatus = document.getElementById("settings-consumables-status-main-brush");
    var consumableSideBrushStatus = document.getElementById("settings-consumables-status-side-brush");
    var consumableFilterStatus = document.getElementById("settings-consumables-status-filter");
    var consumableSensorStatus = document.getElementById("settings-consumables-status-sensor");
    var consumableMopStatus = document.getElementById("settings-consumables-status-mop");
    /*var consumableStatisticsArea =
        document.getElementById("settings-consumables-status-statistics-area");
    var consumableStatisticsHours =
        document.getElementById("settings-consumables-status-statistics-hours");
    var consumableStatisticsCount =
        document.getElementById("settings-consumables-status-statistics-count");*/

    loadingBarSettingsConsumables.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getConsumableStatus();
        setConsumableData(consumableMainBrushStatus, res, "brush", "main");
        setConsumableData(consumableSideBrushStatus, res, "brush", "side_right");
        setConsumableData(consumableFilterStatus, res, "filter", "main");
        setConsumableData(consumableSensorStatus, res, "sensor", "all");
        setConsumableData(consumableMopStatus, res, "mop", "main");

        /*consumableStatisticsArea.innerHTML = res.summary.cleanArea.toFixed(1) + " m²";
        consumableStatisticsHours.innerHTML = res.summary.cleanTime.toFixed(1) + " hours";
        consumableStatisticsCount.innerHTML = res.summary.cleanCount;*/
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsConsumables.removeAttribute("indeterminate");
    }
}

window.updateSettingsConsumablesPage = updateSettingsConsumablesPage;
window.handleConsumableResetButton = handleConsumableResetButton;
