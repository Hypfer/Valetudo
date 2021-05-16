/*global ons */

import {ApiService} from "./services/api.service.js";

var manualControlDurationMS = 250;

var manualControlStateRefreshTimerMS = 2000; // refresh manual control state each x ms
var manualControlEnabled = false;
var manualControlStateRefreshTimer;

var startManualControlButton = document.getElementById("start-manual-control-button");
var forwardManualControlButton = document.getElementById("up-manual-control-button");
var backwardManualControlButton = document.getElementById("down-manual-control-button");
var leftManualControlButton = document.getElementById("left-manual-control-button");
var rightManualControlButton = document.getElementById("right-manual-control-button");
var endManualControlButton = document.getElementById("stop-manual-control-button");
var manualControlLoadingBar = document.getElementById("loading-bar-manualcontrol");

// API / Manual Control Handling
async function manualMoveRobot(directionId) {
    manualControlLoadingBar.setAttribute("indeterminate", "indeterminate");
    try {
        // move for twice the interval we're updating at
        // to keep on track if one package got lost
        await ApiService.setManualControl(directionId, manualControlDurationMS * 2);
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        manualControlLoadingBar.removeAttribute("indeterminate");
    }
}

function _startManualControl() {
    if (!manualControlEnabled) {
        manualControlEnabled = true;
        startManualControlButton.setAttribute("disabled", "disabled");
        endManualControlButton.removeAttribute("disabled");
        document.getElementById("sidemenu").removeAttribute("swipeable");
        document.getElementById("appTabbar").removeAttribute("swipeable");
    }
}

function _stopManualControl() {
    if (manualControlEnabled) {
        manualControlEnabled = false;
        endManualControlButton.setAttribute("disabled", "disabled");
        startManualControlButton.removeAttribute("disabled");
        document.getElementById("sidemenu").setAttribute("swipeable", "swipeable");
        document.getElementById("appTabbar").setAttribute("swipeable", "swipeable");
        // stopManualControlTimer();
    }
}

var movementInterval = null;

function _startMovement(direction) {
    manualMoveRobot(direction);

    if (movementInterval === null) {
        movementInterval = setInterval(() => manualMoveRobot(direction), manualControlDurationMS * 2);
    }
}

function _startMovementForward() {
    return _startMovement("forward");
}
function _startMovementBackward() {
    return _startMovement("backward");
}
function _startMovementLeft() {
    return _startMovement("rotate_counterclockwise");
}
function _startMovementRight() {
    return _startMovement("rotate_clockwise");
}

function _stopMovement() {
    if (movementInterval !== null) {
        clearInterval(movementInterval);
        movementInterval = null;
        return ApiService.stopManualControl();
    }
}

function postponeRefreshManualControlMode() {
    clearInterval(manualControlStateRefreshTimer);
    manualControlStateRefreshTimer =
        setInterval(function() {
            refreshManualControlMode();
        }, manualControlStateRefreshTimerMS);
}

async function startManualControl() {
    if (!manualControlEnabled) {
        manualControlLoadingBar.setAttribute("indeterminate", "indeterminate");
        try {
            await ApiService.startManualControl();
            _startManualControl();
            postponeRefreshManualControlMode();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            manualControlLoadingBar.removeAttribute("indeterminate");
        }
    }
}

async function stopManualControl() {
    if (manualControlEnabled) {
        manualControlLoadingBar.setAttribute("indeterminate", "indeterminate");
        try {
            await ApiService.stopManualControl();
            _stopManualControl();
            postponeRefreshManualControlMode();
        } catch (err) {
            ons.notification.toast(err.message,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        } finally {
            manualControlLoadingBar.removeAttribute("indeterminate");
        }
    }
}

// Page Handling (refresh/update/onload/onhide)
async function refreshManualControlMode() {
    try {
        let res = await ApiService.getVacuumState();
        var StatusStateAttribute = res.find(e => e.__class === "StatusStateAttribute");

        if (StatusStateAttribute && StatusStateAttribute.value === "manual_control") {
            _startManualControl();
        } else {
            _stopManualControl();
        }
    } catch (err) {
        ons.notification.toast(err.message,
            {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
    } finally {
        manualControlLoadingBar.removeAttribute("indeterminate");
    }
}

function ManualControlInit() {
    manualControlLoadingBar.setAttribute("indeterminate", "indeterminate");
    refreshManualControlMode();
    // Since the robot may disable manual control mode by itself, this timer keeps the
    // state of the robot in track with the UI
    manualControlStateRefreshTimer =
        setInterval(function() {
            refreshManualControlMode();
        }, manualControlStateRefreshTimerMS);

    document.addEventListener("mouseup", _stopMovement);
    document.addEventListener("touchend", _stopMovement);

    forwardManualControlButton.addEventListener("mousedown", _startMovementForward);
    forwardManualControlButton.addEventListener("touchstart", _startMovementForward);

    backwardManualControlButton.addEventListener("mousedown", _startMovementBackward);
    backwardManualControlButton.addEventListener("touchstart", _startMovementBackward);

    leftManualControlButton.addEventListener("mousedown", _startMovementLeft);
    leftManualControlButton.addEventListener("touchstart", _startMovementLeft);

    rightManualControlButton.addEventListener("mousedown", _startMovementRight);
    rightManualControlButton.addEventListener("touchstart", _startMovementRight);
}

function ManualControlHide() {
    stopManualControl();
    clearInterval(manualControlStateRefreshTimer);

    document.removeEventListener("mouseup", _stopMovement);
    document.removeEventListener("touchend", _stopMovement);

    forwardManualControlButton.removeEventListener("mousedown", _startMovementForward);
    forwardManualControlButton.removeEventListener("touchstart", _startMovementForward);

    backwardManualControlButton.removeEventListener("mousedown", _startMovementBackward);
    backwardManualControlButton.removeEventListener("touchstart", _startMovementBackward);

    leftManualControlButton.removeEventListener("mousedown", _startMovementLeft);
    leftManualControlButton.removeEventListener("touchstart", _startMovementLeft);

    rightManualControlButton.removeEventListener("mousedown", _startMovementRight);
    rightManualControlButton.removeEventListener("touchstart", _startMovementRight);
}

window.ManualControlInit = ManualControlInit;
window.startManualControl = startManualControl;
window.stopManualControl = stopManualControl;
window.ManualControlHide = ManualControlHide;
window.manualMoveRobot = manualMoveRobot;
