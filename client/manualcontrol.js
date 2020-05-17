/*global ons */

import {ApiService} from "./services/api.service.js";

var manualControlSequenceId = 1;
var manualControlDurationMS = 100;
var maxVelocity = 0.3;
var manualControlMinimalVelocity = 0.02; // below this abs limit robot will not move
var manualControlMinimalOmega = 0.1;     // below this abs limit (currentAngle) robot will not turn
var manualControlminimalDistanceForOmega =
    10; // below this abs limit (currentXYDistance) the robot will not turn
var currentAngle = 0;
var currentYDistance = 0;
var currentXYDistance = 0;
var currentVelocity = 0;
var currentOmega = 0;
var manualControlStateRefreshTimerMS = 2000; // refresh manual control state each x ms
var manualControlEnabled = false;
var manualControlStateRefreshTimer;
var timedManualControlLoop;

var startManualControlButton = document.getElementById("start-manual-control-button");
var endManualControlButton = document.getElementById("stop-manual-control-button");
var manualControlLoadingBar = document.getElementById("loading-bar-manualcontrol");

// API / Manual Control Handling
async function manualMoveRobot(angle, velocity) {
    manualControlLoadingBar.setAttribute("indeterminate", "indeterminate");
    try {
        // move for twice the interval we're updating at
        // to keep on track if one package got lost
        await ApiService.setManualControl(angle, velocity, manualControlDurationMS * 2, manualControlSequenceId++);
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
        stopManualControlTimer();
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

function sendManualControl() {
    // limit velocity to square (up, bottom, left, right are to be equal!)
    if (currentYDistance > cY) {
        currentYDistance = cY;
    }
    currentVelocity = (currentYDistance / cY) * maxVelocity;

    // center deadzone
    if (Math.abs(currentVelocity) < manualControlMinimalVelocity) {
        currentVelocity = 0;
    }

    if (Math.abs(currentAngle) < manualControlMinimalOmega ||
        Math.abs(currentXYDistance) < manualControlminimalDistanceForOmega) {
        currentOmega = 0;
    } else {
        currentOmega = currentAngle;
    }

    drawValuesToCanvas();
    manualMoveRobot(currentOmega, currentVelocity);
}

function startManualControlTimer() {
    if (!timedManualControlLoop && manualControlEnabled) {
        sendManualControl(); // send + start repetitive timer
        timedManualControlLoop =
            setInterval(function() {
                sendManualControl();
            }, manualControlDurationMS);
    }
}

function stopManualControlTimer() {
    if (timedManualControlLoop) {
        clearInterval(timedManualControlLoop);
        timedManualControlLoop = 0;
    }
}

// Canvas orga
let manualControlCanvas = document.getElementById("manual-control-area");
// apply shown dimensions to canvas - required because of percentual css dimension
manualControlCanvas.setAttribute("width", manualControlCanvas.clientWidth);
manualControlCanvas.setAttribute("height", manualControlCanvas.clientHeight);

var manualControlCanvasContext = manualControlCanvas.getContext("2d");
var cX = manualControlCanvas.width / 2;
var cY = manualControlCanvas.height / 2;

manualControlCanvasContext.moveTo(cX, cY);
manualControlCanvasContext.fillStyle = "#ff0044";
manualControlCanvasContext.arc(cX, cY, 5, 0, 360, false);
manualControlCanvasContext.fill();

function drawValuesToCanvas() {
    // delete old values / draw background
    manualControlCanvasContext.fillStyle = "#FFFFFF"; //#9ea7b833
    manualControlCanvasContext.fillRect(0, 0, 200, 50);
    // draw values
    manualControlCanvasContext.font = "12px Helvetica";
    manualControlCanvasContext.textAlign = "left";
    manualControlCanvasContext.fillStyle = "#8A8A8A";
    manualControlCanvasContext.fillText("Velocity:\t" + currentVelocity.toPrecision(2) +
                                            "\tOmega:\t" + currentOmega.toPrecision(2),
    30, 30);
}

// Mouse Handling
function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {x: mouseEvent.clientX - rect.left, y: mouseEvent.clientY - rect.top};
}

["mousedown", "mouseenter", "mouseup", "mouseleave", "mouseout"].forEach(function(evt) {
    manualControlCanvas.addEventListener(evt, function() {
        startManualControlTimer();
    }, false);
});

manualControlCanvas.addEventListener("mousemove", function(e) {
    event.preventDefault();
    var m = getMousePos(manualControlCanvas, e);
    calculateAngleAndDistance(m);
}, false);

// Touch Handling
function getTouchPos(evt) {
    var rect = manualControlCanvas.getBoundingClientRect();

    if (evt && evt.touches) {
        if (evt.touches.length === 1) { // Only deal with one finger
            var touch = evt.touches[0]; // Get the information for finger #1
            return {
                x: touch.pageX - rect.left, //-touch.target.offsetLeft,
                y: touch.pageY - rect.top   //-touch.target.offsetTop
            };
        }
    } else {
        return {x: 0, y: 0};
    }
}

function touchStart(e) {
    e.preventDefault();
    startManualControlTimer();
    var m = getTouchPos();
    calculateAngleAndDistance(m);
}

function touchMove(e) {
    e.preventDefault();
    var m = getTouchPos(e);
    calculateAngleAndDistance(m);
}

function touchEnd() {
    stopManualControlTimer();
}

manualControlCanvas.addEventListener("touchstart", touchStart, false);
manualControlCanvas.addEventListener("touchmove", touchMove, false);
manualControlCanvas.addEventListener("touchcancel", touchEnd, false);
manualControlCanvas.addEventListener("touchend", touchEnd, false);

function calculateAngleAndDistance(m) {
    var tX = Math.abs(cX - m.x);
    var tY = Math.abs(cY - m.y);

    currentYDistance = cY - m.y;
    currentXYDistance = Math.floor(Math.sqrt(tX * tX + tY * tY));

    if (m.x < cX) {
        if (m.y < cY) {
            // upper left
            currentAngle = -Math.atan((cX - m.x) / (m.y - cY));
        } else {
            // lower left
            if (m.y === cY) {
                currentAngle = 0;
            } else {
                currentAngle = -Math.atan((m.x - cX) / (m.y - cY));
            }
        }
    } else {
        if (m.y < cY) {
            // upper right
            currentAngle = Math.atan((cX - m.x) / (cY - m.y));
        } else {
            // lower right
            if (cY === m.y) {
                currentAngle = 0;
            } else {
                currentAngle = Math.atan((m.x - cX) / (cY - m.y));
            }
        }
    }
}

// Page Handling (refresh/update/onload/onhide)
async function refreshManualControlMode() {
    try {
        let res = await ApiService.getCurrentStatus();
        if (res.state === "MANUAL_MODE") {
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
}

function ManualControlHide() {
    stopManualControl();
    clearInterval(manualControlStateRefreshTimer);
}

window.ManualControlInit = ManualControlInit;
window.startManualControl = startManualControl;
window.stopManualControl = stopManualControl;
window.ManualControlHide = ManualControlHide;