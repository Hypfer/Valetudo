/*
 (c) 2017, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
 
 Licensed under BSD 2-Clause "Simplified" License

 Adapted for use in Valetudo
*/

// square distance between 2 points
function getSqDist(points: number[], i: number, j: number): number {
    const dx = points[i] - points[j];
    const dy = points[i + 1] - points[j + 1];
    return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(points: number[], p: number, p1: number, p2: number): number {
    let x = points[p1];
    let y = points[p1 + 1];
    const dx = points[p2] - x;
    const dy = points[p2 + 1] - y;

    if (dx !== 0 || dy !== 0) {
        const t = ((points[p] - x) * dx + (points[p + 1] - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = points[p2];
            y = points[p2 + 1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    const dX = points[p] - x;
    const dY = points[p + 1] - y;

    return dX * dX + dY * dY;
}

// basic distance-based simplification
function simplifyRadialDist(points: number[], sqTolerance: number): number[] {
    const newPoints: number[] = points.slice(0, 2);

    for (let i = 2; i < points.length; i += 2) {
        if (getSqDist(points, i, i - 2) > sqTolerance) {
            newPoints.push(points[i], points[i + 1]);
        }
    }

    if (points.length >= 2 && (newPoints[newPoints.length - 2] !== points[points.length - 2] ||
        newPoints[newPoints.length - 1] !== points[points.length - 1])) {
        newPoints.push(points[points.length - 2], points[points.length - 1]);
    }

    return newPoints;
}

function simplifyDPStep(
    points: number[],
    first: number,
    last: number,
    sqTolerance: number,
    simplified: number[]
): void {
    let maxSqDist = sqTolerance;
    let index = -1;

    for (let i = first + 2; i < last; i += 2) {
        const sqDist = getSqSegDist(points, i, first, last);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance && index !== -1) {
        if (index - first > 2) {
            simplifyDPStep(points, first, index, sqTolerance, simplified);
        }
        simplified.push(points[index], points[index + 1]);
        if (last - index > 2) {
            simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }
}

// simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(points: number[], sqTolerance: number): number[] {
    const last = points.length - 2;
    const simplified = [points[0], points[1]];

    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last], points[last + 1]);

    return simplified;
}

export function simplify(
    points: number[],
    tolerance?: number,
    highestQuality?: boolean
): number[] {
    if (points.length <= 4) {
        return points;
    }

    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);

    return points;
}
