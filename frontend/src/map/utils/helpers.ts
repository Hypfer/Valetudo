import {PointCoordinates} from "./types";

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

export function considerHiDPI(val : number): number {
    return Math.round(val * window.devicePixelRatio);
}

export function isInsideBox(point: PointCoordinates, box: Box) {
    return (
        point.x >= box.topLeftBound.x &&
        point.x <= box.bottomRightBound.x &&
        point.y >= box.topLeftBound.y &&
        point.y <= box.bottomRightBound.y
    );
}

export function calculateBoxAroundPoint(point: PointCoordinates, boxPadding: number) : Box {
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
