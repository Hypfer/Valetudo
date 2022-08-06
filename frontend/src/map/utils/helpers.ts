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

export function isInsideBox(point: PointCoordinates, box: Box) {
    return (
        point.x >= box.topLeftBound.x &&
        point.x <= box.bottomRightBound.x &&
        point.y >= box.topLeftBound.y &&
        point.y <= box.bottomRightBound.y
    );
}

export function calculateBoxAroundPoint(point: PointCoordinates, boxPadding: number) : Box {
    return {
        topLeftBound: {
            x: point.x - boxPadding,
            y: point.y - boxPadding
        },
        bottomRightBound: {
            x: point.x + boxPadding,
            y: point.y + boxPadding
        }
    };
}
