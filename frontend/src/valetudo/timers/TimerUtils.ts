import {Timer} from "../../api";
import {deepCopy} from "../../utils";

export function convertTimer(timer: Timer, offset: number) : Timer {
    const newTimer = deepCopy(timer);

    const dayInMinutes = 24*60;

    const utcMidnightOffset = timer.hour * 60 + timer.minute;
    let localTimeMidnightOffset = utcMidnightOffset + offset;

    if (localTimeMidnightOffset >= 24*60) {
        //shift dow forward
        newTimer.dow = newTimer.dow.map(day => (day + 1) % 7);
    } else if (localTimeMidnightOffset < 0) {
        //shift dow backward
        newTimer.dow = newTimer.dow.map(day => (day + 6) % 7);
    }

    if (localTimeMidnightOffset < 0) {
        localTimeMidnightOffset += dayInMinutes;
    } else if (localTimeMidnightOffset >= dayInMinutes) {
        localTimeMidnightOffset -= dayInMinutes;
    }

    newTimer.hour = Math.floor(localTimeMidnightOffset/60);
    newTimer.minute = localTimeMidnightOffset % 60;

    return newTimer;
}
