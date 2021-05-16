/*global ons */
import {ApiService} from "./services/api.service.js";
import {TimezoneService} from "./services/timezone.service.js";

async function showTimeZoneDialog() {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");

    loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
    try {
        let currentTimeZone = await ApiService.getTimezone();

        var timeZoneSelection = document.getElementById("timezone-selection");
        if (timeZoneSelection.childElementCount === 0) {
            // initialize select options only if not already done
            var allTimezones = await TimezoneService.getAllTimezones();
            allTimezones.forEach(function(tmpTimeZone) {
                var tmpOption = document.createElement("option");
                tmpOption.innerText = tmpTimeZone;
                tmpOption.value = tmpTimeZone;
                if (tmpTimeZone === currentTimeZone) {
                    tmpOption.selected = true;
                }
                timeZoneSelection.appendChild(tmpOption);
            });
        } else {
            // adjust selection to match server side setting
            for (var i = 0; i < timeZoneSelection.options.length; i++) {
                let tmpOption = timeZoneSelection.options[i];
                tmpOption.selected = tmpOption.value === currentTimeZone;
            }
        }
        document.getElementById("edit-timezone-dialog").show();
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsTimers.removeAttribute("indeterminate");
    }
}

function hideTimeZoneDialog() {
    document.getElementById("edit-timezone-dialog").hide();
}

async function saveTimeZone() {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");

    var timeZoneSelection = document.getElementById("timezone-selection");
    var newTimezone = timeZoneSelection.options[timeZoneSelection.selectedIndex].value;

    let answer = await ons.notification.confirm("Do you really want to set your timezone to \"" + newTimezone + "\"?");

    if (answer === 1) {
        loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
        try {
            await ApiService.setTimezone(newTimezone);
            hideTimeZoneDialog();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            loadingBarSettingsTimers.removeAttribute("indeterminate");
        }
    }
}

var showDndTimerDialog = function(startHour, startMinute, endHour, endMinute) {
    document.getElementById("edit-dnd-form").start_hour.value = (startHour >= 0 ? startHour : "");
    document.getElementById("edit-dnd-form").start_minute.value =
        (startMinute >= 0 ? startMinute : "");
    document.getElementById("edit-dnd-form").end_hour.value = (endHour >= 0 ? endHour : "");
    document.getElementById("edit-dnd-form").end_minute.value = (endMinute >= 0 ? endMinute : "");
    document.getElementById("edit-dnd-timer-dialog").show();
};

var hideDndTimerDialog = function() {
    document.getElementById("edit-dnd-timer-dialog").hide();
};

// TODO: There should be some util to convert numbers to leading zero numbers
function asTwoDigitNumber(number) {
    if (number < 10) {
        return "0" + number;
    } else {
        return number;
    }
}

async function updateDndTimerPage() {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");
    var dndTimerList = document.getElementById("settings-dnd-timer-list");

    loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
    while (dndTimerList.lastChild) {
        dndTimerList.removeChild(dndTimerList.lastChild);
    }
    try {
        let res = await ApiService.getDndConfiguration();
        if (res.length === 0 || !(res.enabled) ) {
            // no timer is enabled yet, show possibility to add dnd timer
            dndTimerList.appendChild(ons.createElement(
                "<ons-list-item>\n" +
                "    <div class='left'>There is no DND timer enabled yet.</div>" +
                "    <div class='right'>" +
                "        <ons-button modifier='quiet' class='button-margin' style='font-size: 2em;' onclick='showDndTimerDialog(-1, -1, -1, -1);'>" +
                "            <ons-icon icon='fa-edit'></ons-icon>" +
                "        </ons-button>" +
                "    </div>" +
                "</ons-list-item>"));
        } else {
            // Show current active timer
            const offset = new Date().getTimezoneOffset() *-1;
            const dndTime = {
                start: convertTime(res.start.hour, res.start.minute, offset),
                end: convertTime(res.end.hour, res.end.minute, offset)
            };

            dndTimerList.appendChild(ons.createElement(
                "<ons-list-item>\n" +
                "    <div class='left'>DND will start at " + dndTime.start.hour + ":" +
                asTwoDigitNumber(dndTime.start.minute) + " and end on " +
                dndTime.end.hour + ":" + asTwoDigitNumber(dndTime.end.minute) + "</div>" +
                "    <div class='right'>" +
                "        <ons-button modifier='quiet' class='button-margin' style='font-size: 2em;' onclick='showDndTimerDialog(" +
                dndTime.start.hour + ", " + dndTime.start.minute + ", " +
                dndTime.end.hour + ", " + dndTime.end.minute + ");'>" +
                "            <ons-icon icon='fa-edit'></ons-icon>" +
                "        </ons-button>" +
                "        <ons-button modifier='quiet' class='button-margin' style='font-size: 2em;' onclick='deleteDndTimer();'>" +
                "            <ons-icon icon='fa-trash'></ons-icon>" +
                "        </ons-button>" +
                "    </div>" +
                "</ons-list-item>"
            ));
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsTimers.removeAttribute("indeterminate");
    }
}

function convertTime(hour, minute, offset) {
    const dayInMinutes = 24*60;

    const inMidnightOffset = hour * 60 + minute;
    let outMidnightOffset = inMidnightOffset + offset;

    if (outMidnightOffset < 0) {
        outMidnightOffset += dayInMinutes;
    } else if (outMidnightOffset > dayInMinutes) {
        outMidnightOffset -= dayInMinutes;
    }

    return {
        hour: outMidnightOffset/60 |0,
        minute: outMidnightOffset%60
    };
}

async function deleteDndTimer() {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");
    try {
        let answer = await ons.notification.confirm("Do you really want to disable DND?");
        if (answer === 1) {
            loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
            await ApiService.setDndConfiguration(false, 0, 0, 0, 0);
            updateDndTimerPage();
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsTimers.removeAttribute("indeterminate");
    }

}

async function saveDndTimer() {
    var start_hour = document.getElementById("edit-dnd-form").start_hour.value;
    var start_minute = document.getElementById("edit-dnd-form").start_minute.value;
    var end_hour = document.getElementById("edit-dnd-form").end_hour.value;
    var end_minute = document.getElementById("edit-dnd-form").end_minute.value;

    if (start_hour && start_minute && end_hour && end_minute) {
        const offset = new Date().getTimezoneOffset();
        const dndTime = {
            start: convertTime(parseInt(start_hour), parseInt(start_minute), offset),
            end: convertTime(parseInt(end_hour), parseInt(end_minute), offset)
        };

        try {
            await ApiService.setDndConfiguration(
                true,
                dndTime.start.hour,
                dndTime.start.minute,
                dndTime.end.hour,
                dndTime.end.minute
            );

            hideDndTimerDialog();
            updateDndTimerPage();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    } else {
        ons.notification.toast(
            "Could not save DND Timer since not all required attributes are provided!",
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }
}

async function updateSettingsTimersPage() {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");
    var timersSettingsTimersList = document.getElementById("settings-timers-timer-list");

    loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
    while (timersSettingsTimersList.lastChild) {
        timersSettingsTimersList.removeChild(timersSettingsTimersList.lastChild);
    }
    try {
        let res = await ApiService.getTimers();
        if (res === null || res === undefined || res.length === 0) {
            timersSettingsTimersList.appendChild(ons.createElement(
                "<ons-list-item>\n" +
                "    <div class='center'>There is no timer configured yet.</div>" +
                "</ons-list-item>"));
        }

        res.forEach(function(timer) {
            // ADD EDIT (equals create new + delete!)
            var elem = ons.createElement(
                "<ons-list-item data-id='" + timer.id + "'>\n" +
                "    <div class='left'>" + timer.human_desc + " (" + timer.cron + ")</div>" +
                "    <div class='right'>" +
                "        <ons-switch class='timer-active-switch'" +
                (timer.enabled ? " checked='checked' " : "") + "></ons-switch> " +
                "        <ons-button modifier='quiet' class='button-margin timer-delete'>" +
                "            <ons-icon icon='fa-trash'></ons-icon>" +
                "        </ons-button>" +
                "    </div>" +
                "</ons-list-item>");

            elem.querySelector(".timer-active-switch")
                .addEventListener("change",
                    function(event) {
                        toggleTimer(timer.id, event.value);
                    });

            elem.querySelector(".timer-delete")
                .addEventListener("click", function(event) {
                    deleteTimer(timer.id);
                });

            timersSettingsTimersList.appendChild(elem);
        });
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsTimers.removeAttribute("indeterminate");
    }
}

async function toggleTimer(id, enabled) {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");

    disableTimerInputElements();
    loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
    try {
        await ApiService.toggleTimer(id, enabled);
        window.setTimeout(function() {
            updateSettingsTimersPage();
        }, 350);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        loadingBarSettingsTimers.removeAttribute("indeterminate");
    }
}

function disableTimerInputElements() {
    var timersSettingsTimersList = document.getElementById("settings-timers-timer-list");

    timersSettingsTimersList.querySelectorAll(".timer-active-switch")
        .forEach(function(elem) {
            elem.setAttribute("disabled", "disabled");
        });
    timersSettingsTimersList.querySelectorAll(".timer-delete")
        .forEach(function(elem) {
            elem.setAttribute("disabled", "disabled");
        });
}

function enableTimerInputElements() {
    var timersSettingsTimersList = document.getElementById("settings-timers-timer-list");

    timersSettingsTimersList.querySelectorAll(".timer-active-switch")
        .forEach(function(elem) {
            elem.removeAttribute("disabled");
        });
    timersSettingsTimersList.querySelectorAll(".timer-delete")
        .forEach(function(elem) {
            elem.removeAttribute("disabled");
        });
}

async function deleteTimer(id) {
    var loadingBarSettingsTimers = document.getElementById("loading-bar-settings-timers");

    disableTimerInputElements();
    let answer = await ons.notification.confirm("Do you really want to delete this timer?");
    if (answer === 1) {
        loadingBarSettingsTimers.setAttribute("indeterminate", "indeterminate");
        try {
            await ApiService.deleteTimer(id);
            updateSettingsTimersPage();
        } catch (err) {
            ons.notification.toast(
                err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            loadingBarSettingsTimers.removeAttribute("indeterminate");
        }
    } else {
        enableTimerInputElements();
    }
}

function clearNewTimerDialog() {
    document.getElementById("add-timer-form").month.value = "";
    document.getElementById("add-timer-form").day.value = "";
    document.getElementById("add-timer-form").hour.value = "";
    document.getElementById("add-timer-form").minute.value = "";
    var daysRunner;
    for (daysRunner = 0; daysRunner < document.getElementById("add-timer-form").days.length;
        daysRunner++) {
        document.getElementById("add-timer-form").days[daysRunner].checked = false;
    }
}

async function addNewTimer() {
    // get and validate selected month
    var monthValue = document.getElementById("add-timer-form").month.value;
    if (monthValue === "") {
        monthValue = "*";
    } else {
        // verify limits of month
        var monthNumber = parseInt(monthValue) || 0;
        if (monthNumber < 1) {
            monthValue = 1;
        } else if (monthNumber > 12) {
            monthValue = 12;
        }
    }
    // get and validate selected day
    var dayValue = document.getElementById("add-timer-form").day.value;
    if (dayValue === "") {
        dayValue = "*";
    } else {
        // verify limits of day
        var dayNumber = parseInt(dayValue) || 0;
        if (dayNumber < 1) {
            dayValue = 1;
        } else if (dayNumber > 31) {
            dayValue = 31;
        }
    }
    // get and validate selected hour
    var hoursValue = document.getElementById("add-timer-form").hour.value;
    if (hoursValue === "") {
        hoursValue = "*";
    } else {
        // verify limits of hour
        var hoursNumber = parseInt(hoursValue) || 0;
        if (hoursNumber < 0) {
            hoursValue = 0;
        } else if (hoursNumber > 23) {
            hoursValue = hoursNumber % 24;
        }
    }
    // get and validate selected minute
    var minutesValue = document.getElementById("add-timer-form").minute.value;
    if (minutesValue === "") {
        minutesValue = "*";
    } else {
        // verify limits of minute
        var minutesNumber = parseInt(minutesValue) || 0;
        if (minutesNumber < 0) {
            minutesValue = 0;
        } else if (minutesNumber > 59) {
            minutesValue = minutesNumber % 60;
        }
    }
    // get and validate selected days
    var daySelection = "";
    var daysElementArray = document.getElementById("add-timer-form").days;
    var daysTotal = daysElementArray.length;
    var daysRunner;
    for (daysRunner = 0; daysRunner < daysTotal; daysRunner++) {
        if (daysElementArray[daysRunner].checked) {
            var currentDayValue = daysElementArray[daysRunner].value;
            if (daySelection === "") {
                daySelection = currentDayValue;
            } else {
                daySelection += "," + currentDayValue;
            }
        }
    }
    if (daySelection === "") {
        daySelection = "*";
    }
    // build cron timer
    var cronTimer = "" + minutesValue + " " + hoursValue + " " + dayValue + " " + monthValue + " " +
                    daySelection;
    // save timer
    try {
        await ApiService.addTimer(cronTimer);
        updateSettingsTimersPage();
        hideNewTimerDialog();
    } catch (err) {
        ons.notification.toast(
            err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    }
}

// if timerId is set to -1, the timer is deleted
var showAddTimerDialog = function(timerId) {
    if (timerId === -1) {
        clearNewTimerDialog();
    }
    document.getElementById("add-timer-dialog").show();
};

var hideNewTimerDialog = function() {
    document.getElementById("add-timer-dialog").hide();
};

window.updateSettingsTimersPage = updateSettingsTimersPage;
window.updateDndTimerPage = updateDndTimerPage;
window.showTimeZoneDialog = showTimeZoneDialog;
window.hideTimeZoneDialog = hideTimeZoneDialog;
window.saveTimeZone = saveTimeZone;
window.showDndTimerDialog = showDndTimerDialog;
window.hideDndTimerDialog = hideDndTimerDialog;
window.deleteDndTimer = deleteDndTimer;
window.saveDndTimer = saveDndTimer;
window.addNewTimer = addNewTimer;
window.showAddTimerDialog = showAddTimerDialog;
window.hideNewTimerDialog = hideNewTimerDialog;
