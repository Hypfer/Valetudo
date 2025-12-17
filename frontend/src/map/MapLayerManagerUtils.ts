import {RawMapLayer} from "../api";
import {FourColorTheoremSolver} from "./utils/colors/FourColorTheoremSolver";
import {PaletteMode} from "@mui/material";

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

function hexToRgb(hex: string) : RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());

    if (result === null) {
        throw new Error(`Invalid color ${hex}`);
    }

    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } ;
}

export function adjustRGBColorBrightness(color: RGBColor, percent: number): RGBColor {
    const multiplier = (100 + percent) / 100;

    return {
        r: Math.round(Math.min(255, Math.max(0, color.r * multiplier))),
        g: Math.round(Math.min(255, Math.max(0, color.g * multiplier))),
        b: Math.round(Math.min(255, Math.max(0, color.b * multiplier)))
    };
}


export function PROCESS_LAYERS(layers: Array<RawMapLayer>, pixelSize: number, paletteMode: PaletteMode, selectedSegmentIds: string[]) {
    const dimensions = CALCULATE_REQUIRED_DIMENSIONS(layers);
    const width = dimensions.x.sum;
    const height = dimensions.y.sum;

    const pixelData = new Uint8ClampedArray( width * height * 4 ); // RGBA
    const segmentLookupData = new Uint8ClampedArray( width * height);
    const segmentLookupIdMapping = new Map(); //Because segment IDs are arbitrary strings, we need this mapping to an int for the lookup data

    const colorFinder = new FourColorTheoremSolver(layers, pixelSize);


    const hasSelectedSegments = selectedSegmentIds.length === 0;

    let colors: LayerColors = COLORS;
    let backgroundColors: LayerColors = BACKGROUND_COLORS;
    if (paletteMode === "dark") {
        colors = DARK_COLORS;
        backgroundColors = DARK_BACKGROUND_COLORS;
    }

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

export const COLORS: LayerColors = {
    floor: hexToRgb("#0076ff"),
    wall: hexToRgb("#333333"),
    segments: [
        hexToRgb("#19A1A1"),
        hexToRgb("#7AC037"),
        hexToRgb("#DF5618"),
        hexToRgb("#F7C841"),
        hexToRgb("#9966CC") // "fallback" color
    ]
};

export const BACKGROUND_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -40),
    wall: adjustRGBColorBrightness(COLORS.wall, -15),
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -40))
};

export const DARK_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -20),
    wall: COLORS.wall,
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -20))
};

export const DARK_BACKGROUND_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -50),
    wall: adjustRGBColorBrightness(COLORS.wall, -20),
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -50))
};
