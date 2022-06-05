export type SegmentId = string;

export type PossibleSegmentId = SegmentId | undefined;

export type SegmentColorId = number;

export type PossibleSegmentColorId = SegmentColorId | undefined;

export function create2DArray(xLength: number, yLength: number) {
    return [...new Array(xLength)].map(elem => {
        return [...new Array(yLength)];
    });
}
