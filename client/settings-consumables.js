/*global ons, fn*/
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

ons.getScriptPage().onShow = function() {
    updateSettingsConsumablesPage();
};

// eslint-disable-next-line no-unused-vars
function handleConsumableResetButton(consumable) {
    ons.notification.confirm("Do you really want to reset this consumable?").then(function(answer) {
        if (answer === 1) {
            loadingBarSettingsConsumables.setAttribute("indeterminate", "indeterminate");

            fn.requestWithPayload(
                "api/reset_consumable", JSON.stringify({consumable: consumable}), "PUT",
                function(err, res) {
                    if (err) {
                        loadingBarSettingsConsumables.removeAttribute("indeterminate");
                        ons.notification.toast(
                            err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                    } else {
                        updateSettingsConsumablesPage();
                    }
                });
        }
    });
}

function updateSettingsConsumablesPage() {
    loadingBarSettingsConsumables.setAttribute("indeterminate", "indeterminate");
    fn.request("api/consumable_status", "GET", function(err, res) {
        loadingBarSettingsConsumables.removeAttribute("indeterminate");
        if (!err) {
            consumableMainBrushStatus.innerHTML =
                (Math.max(0, 300 - (res.consumables.main_brush_work_time / 60 / 60))).toFixed(1) +
                " hours left";
            consumableSideBrushStatus.innerHTML =
                (Math.max(0, 200 - (res.consumables.side_brush_work_time / 60 / 60))).toFixed(1) +
                " hours left";
            consumableFilterStatus.innerHTML =
                (Math.max(0, 150 - (res.consumables.filter_work_time / 60 / 60))).toFixed(1) +
                " hours left";
            consumableSensorStatus.innerHTML =
                (Math.max(0, 30 - (res.consumables.sensor_dirty_time / 60 / 60))).toFixed(1) +
                " hours left";

            consumableStatisticsArea.innerHTML = res.summary.cleanArea.toFixed(1) + " m²";
            consumableStatisticsHours.innerHTML = res.summary.cleanTime.toFixed(1) + " hours";
            consumableStatisticsCount.innerHTML = res.summary.cleanCount;
        } else {
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}
