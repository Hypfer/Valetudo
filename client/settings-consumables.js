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

async function updateSettingsConsumablesPage() {
    var loadingBarSettingsConsumables = document.getElementById("loading-bar-settings-consumables");
    var consumableMainBrushStatus = document.getElementById("settings-consumables-status-main-brush");
    var consumableSideBrushStatus = document.getElementById("settings-consumables-status-side-brush");
    var consumableFilterStatus = document.getElementById("settings-consumables-status-filter");
    var consumableSensorStatus = document.getElementById("settings-consumables-status-sensor");
    var consumableStatisticsArea =
        document.getElementById("settings-consumables-status-statistics-area");
    var consumableStatisticsHours =
        document.getElementById("settings-consumables-status-statistics-hours");
    var consumableStatisticsCount =
        document.getElementById("settings-consumables-status-statistics-count");

    loadingBarSettingsConsumables.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getConsumableStatus();

        consumableMainBrushStatus.innerHTML =
            (res.find(e => e.type === "brush" && e.subType === "main").remaining.value / 60).toFixed(1) + " hours left";
        consumableSideBrushStatus.innerHTML =
            (res.find(e => e.type === "brush" && e.subType === "side_right").remaining.value / 60).toFixed(1) + " hours left";
        consumableFilterStatus.innerHTML =
            (res.find(e => e.type === "filter" && e.subType === "main").remaining.value / 60).toFixed(1) + " hours left";
        consumableSensorStatus.innerHTML =
            (res.find(e => e.type === "sensor" && e.subType === "all").remaining.value / 60).toFixed(1) + " hours left";

        res = await ApiService.getCleanSummary();
        consumableStatisticsArea.innerHTML = res.area.value.toFixed(1) + " m²";
        consumableStatisticsHours.innerHTML = (res.hours.value / 60).toFixed(1) + " hours";
        consumableStatisticsCount.innerHTML = res.count.value;
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsConsumables.removeAttribute("indeterminate");
    }
}

window.updateSettingsConsumablesPage = updateSettingsConsumablesPage;
window.handleConsumableResetButton = handleConsumableResetButton;
