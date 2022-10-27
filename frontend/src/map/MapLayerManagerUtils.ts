import {RawMapLayer} from "../api";
import {FourColorTheoremSolver} from "./utils/colors/FourColorTheoremSolver";

export type RGBColor = {
    r: number;
    g: number;
    b: number;
}

export type LayerColors = {
    floor: RGBColor;
    wall: RGBColor;
    segments: RGBColor[];
};

export function PROCESS_LAYERS(layers: Array<RawMapLayer>, pixelSize: number, colors: LayerColors, backgroundColors: LayerColors, selectedSegmentIds: string[]) {
    const dimensions = CALCULATE_REQUIRED_DIMENSIONS(layers);
    const width = dimensions.x.sum;
    const height = dimensions.y.sum;

    const pixelData = new Uint8ClampedArray( width * height * 4 );
    const segmentLookupData = new Uint8ClampedArray( width * height);
    const segmentLookupIdMapping = new Map(); //Because segment IDs are arbitrary strings, we need this mapping to an int for the lookup data

    const colorFinder = new FourColorTheoremSolver(layers, pixelSize);


    const hasSelectedSegments = selectedSegmentIds.length === 0;

    [...layers].sort((a,b) => {
        return TYPE_SORT_MAPPING[a.type] - TYPE_SORT_MAPPING[b.type];
    }).forEach(layer => {
        let color;

        switch (layer.type) {
            case "floor":
                if (hasSelectedSegments) {
                    color = colors.floor;
                } else {
                    color = backgroundColors.floor;
                }
                break;
            case "wall":
                if (hasSelectedSegments) {
                    color = colors.wall;
                } else {
                    color = backgroundColors.wall;
                }
                break;
            case "segment": {
                if (hasSelectedSegments || selectedSegmentIds.includes(layer.metaData.segmentId ?? "")) {
                    color = colors.segments[colorFinder.getColor((layer.metaData.segmentId ?? ""))];
                } else {
                    color = backgroundColors.segments[colorFinder.getColor((layer.metaData.segmentId ?? ""))];
                }
                break;
            }
        }

        if (!color) {
            // eslint-disable-next-line no-console
            console.error(`Missing color for ${layer.type} with segment id '${layer.metaData.segmentId}'.`);
            color = {r: 128, g: 128, b: 128};
        }

        let segmentLookupId = 0;
        if (layer.metaData.segmentId) {
            segmentLookupId = segmentLookupIdMapping.size + 1;
            segmentLookupIdMapping.set(segmentLookupId, layer.metaData.segmentId);
        }

        for (let i = 0; i < layer.pixels.length; i = i + 2) {
            const offset = (
                (layer.pixels[i] - dimensions.x.min) +
                ((layer.pixels[i+1] - dimensions.y.min) * width)
            );
            const imgDataOffset = offset * 4;

            pixelData[imgDataOffset] = color.r;
            pixelData[imgDataOffset + 1] = color.g;
            pixelData[imgDataOffset + 2] = color.b;
            pixelData[imgDataOffset + 3] = 255;

            segmentLookupData[offset] = segmentLookupId;
        }
    });

    return {
        pixelData: pixelData,
        width: dimensions.x.sum,
        height: dimensions.y.sum,
        left: dimensions.x.min,
        top: dimensions.y.min,

        segmentLookupData: segmentLookupData,
        segmentLookupIdMapping: Object.fromEntries(segmentLookupIdMapping)
    };
}

function CALCULATE_REQUIRED_DIMENSIONS(layers: Array<RawMapLayer>) {
    const dimensions = {
        x: {
            min: Infinity,
            max: -Infinity,
            sum: 0,
        },
        y: {
            min: Infinity,
            max: -Infinity,
            sum: 0,
        },
    };

    layers.forEach(layer => {
        dimensions.x.min = layer.dimensions.x.min < dimensions.x.min ? layer.dimensions.x.min : dimensions.x.min;
        dimensions.x.max = layer.dimensions.x.max > dimensions.x.max ? layer.dimensions.x.max : dimensions.x.max;

        dimensions.y.min = layer.dimensions.y.min < dimensions.y.min ? layer.dimensions.y.min : dimensions.y.min;
        dimensions.y.max = layer.dimensions.y.max > dimensions.y.max ? layer.dimensions.y.max : dimensions.y.max;
    });

    dimensions.x.sum = (dimensions.x.max - dimensions.x.min) + 1;
    dimensions.y.sum = (dimensions.y.max - dimensions.y.min) + 1;
    dimensions.x.sum = isFinite(dimensions.x.sum) ? dimensions.x.sum : 0;
    dimensions.y.sum = isFinite(dimensions.y.sum) ? dimensions.y.sum : 0;

    return dimensions;
}

// This is important because it determines the draw order
const TYPE_SORT_MAPPING = {
    "floor": 14,
    "segment": 15,
    "wall": 16
};

