/*global ons */
import {ApiService} from "./services/api.service.js";

const TYPE_MAPPING = Object.freeze({
    "brush": "Brush",
    "filter": "Filter",
    "sensor": "Sensor cleaning",
    "mop": "Mop"
});

const SUBTYPE_MAPPING = Object.freeze({
    "main": "Main",
    "side_right": "Right",
    "side_left": "Left",
    "all": "",
    "none": ""
});

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

function formatConsumableType(type, subType) {
    let ret = "";
    if (SUBTYPE_MAPPING[subType]) {
        ret += SUBTYPE_MAPPING[subType] + " ";
    }
    if (TYPE_MAPPING[type]) {
        ret += TYPE_MAPPING[type];
    }
    return ret || "Unknown consumable: " + type + ", " + subType;
}

async function updateSettingsConsumablesPage() {
    var loadingBarSettingsConsumables = document.getElementById("loading-bar-settings-consumables");
    /*var consumableStatisticsArea =
        document.getElementById("settings-consumables-status-statistics-area");
    var consumableStatisticsHours =
        document.getElementById("settings-consumables-status-statistics-hours");
    var consumableStatisticsCount =
        document.getElementById("settings-consumables-status-statistics-count");*/

    loadingBarSettingsConsumables.setAttribute("indeterminate", "indeterminate");
    try {
        let res = await ApiService.getConsumableStatus();

        const consumablesList = document.getElementById("consumables-list");
        while (consumablesList.lastChild) {
            consumablesList.removeChild(consumablesList.lastChild);
        }

        res.forEach(consumable => {
            let item = document.createElement("ons-list-item");
            let title = document.createElement("div");
            title.classList.add("left");
            title.classList.add("consumables-list-item-title");
            title.innerText = formatConsumableType(consumable.type, consumable.subType);
            item.appendChild(title);

            let value = document.createElement("div");
            value.classList.add("center");
            value.style.marginLeft = "5%";
            value.innerText = (consumable.remaining.value / 60).toFixed(1) + " hours left";
            item.appendChild(value);

            let reset = document.createElement("div");
            reset.classList.add("right");
            reset.innerHTML = "<ons-icon icon=\"fa-undo\" class=\"list-item__icon\" style=\"color: #eb5959;\" onclick=\"handleConsumableResetButton('" + consumable.type + "', '" + consumable.subType + "');\"></ons-icon>";
            item.appendChild(reset);

            consumablesList.appendChild(item);
        });

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
