import {PointCoordinates} from "./types";


// noinspection JSDeprecatedSymbols
const isSufferingFromSafari = (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent || "") ||
    window.navigator.vendor === "Apple Computer, Inc."
);
const _considerHiDPI = function considerHiDPI(val: number): number {
    return Math.round(val * window.devicePixelRatio);
};
const _doNotConsiderHiDPI = function doNotConsiderHiDPI(val: number): number {
    return val;
};

export const considerHiDPI: (val: number) => number = !isSufferingFromSafari ? _considerHiDPI : _doNotConsiderHiDPI;

export function clampMapScalingFactorFactor(currentScaleFactor: number, factor: number) {
    const LIMITS = {
        MIN: Math.min(considerHiDPI(0.4), 0.4),
        MAX: Math.min(considerHiDPI(150), 180) // ff mobile 126 performance suffers beyond 150
    };
    let clampedFactor = factor;

    if (factor * currentScaleFactor < LIMITS.MIN && factor < 1) {
        clampedFactor = LIMITS.MIN / currentScaleFactor;
    } else if (factor * currentScaleFactor > LIMITS.MAX && factor > 1) {
        clampedFactor = LIMITS.MAX / currentScaleFactor;
    }

    return clampedFactor;
}

type Box = {
    topLeftBound: {
        x: number,
        y: number
    },
    bottomRightBound: {
        x: number,
        y: number
    }
}

export function isInsideBox(point: PointCoordinates, box: Box) {
    return (
        point.x >= box.topLeftBound.x &&
        point.x <= box.bottomRightBound.x &&
        point.y >= box.topLeftBound.y &&
        point.y <= box.bottomRightBound.y
    );
}

export function calculateBoxAroundPoint(point: PointCoordinates, boxPadding: number): Box {
    const padding = considerHiDPI(boxPadding);

    return {
        topLeftBound: {
            x: point.x - padding,
            y: point.y - padding
        },
        bottomRightBound: {
            x: point.x + padding,
            y: point.y + padding
        }
    };
}
