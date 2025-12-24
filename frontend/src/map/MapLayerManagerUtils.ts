// noinspection ES6PreferShortImport - Import cannot be shortened without ending up with a cyclic dependency in the build
import {RawMapLayer, RawMapLayerMaterial} from "../api/RawMapData";
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

/**
 * Returns true if the pixel should be rendered in the accent color. Otherwise false
 */
type PixelPatternHandler = (x: number, y: number) => boolean;

const solidFillPixelPatternHandler: PixelPatternHandler = (x, y) => {
    return false;
};

/*
 * +-----+-----+
 * |     |     |
 * |     |     |
 * +-----+-----+
 * |     |     |
 * |     |     |
 * +-----+-----+
 */
const tilePixelPatternHandler: PixelPatternHandler = (x, y) => {
    const TILE_SIZE = 6;

    return x % TILE_SIZE === 0 || y % TILE_SIZE === 0;
};

/* 
 * < PLANK_WIDTH >
 * |           |           |
 * |           |           |
 * |-----------|           | 
 * |           |           |  ^
 * |           |-----------|  <-- ( Controlled by JOINT_OFFSET)
 * |           |           |  PLANK_LENGTH
 * |           |           |  v
 * |-----------|           |
 * |           |           |
 */
const createPlankPixelPatternHandler = (isHorizontal: boolean): PixelPatternHandler => {
    const PLANK_WIDTH = 5;
    const PLANK_LENGTH = 24;
    const JOINT_OFFSET = PLANK_LENGTH / 2;

    return (x, y) => {
        const mainAxisCoord = isHorizontal ? y : x;
        const crossAxisCoord = isHorizontal ? x : y;

        if (mainAxisCoord % PLANK_WIDTH === 0) {
            return true;
        }

        const plankStripIndex = Math.floor(mainAxisCoord / PLANK_WIDTH);
        const isEvenStrip = plankStripIndex % 2 === 0;

        const currentJointPosition = isEvenStrip ? 0 : JOINT_OFFSET;

        return crossAxisCoord % PLANK_LENGTH === currentJointPosition;
    };
};

/*
 *  / / / / \ \ \ \ / / / /
 * / / / /   \ \ \ \ / / / /
 *  / / / / \ \ \ \ / / / /
 * / / / /   \ \ \ \ / / / /
 *  / / / / \ \ \ \ / / / /
 */
const chevronPixelPatternHandler: PixelPatternHandler = (x, y) => {
    const PLANK_WIDTH = 4;
    const SECTION_WIDTH = 8;

    const zig = Math.floor(x / SECTION_WIDTH) % 2 === 0; // false = zag
    const diagonalValue = zig ? (x + y) : (x - y);

    return diagonalValue % PLANK_WIDTH === 0;
};


/*
 * +-----+-----+
 * | ||| | === |
 * | ||| | === |
 * +-----+-----+
 * | === | ||| |
 * | === | ||| |
 * +-----+-----+
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parquetPixelPatternHandler: PixelPatternHandler = (x, y) => {
    const BLOCK_SIZE = 8;
    const PLANK_GAP = 2;

    if (x % BLOCK_SIZE === 0 || y % BLOCK_SIZE === 0) {
        return true;
    }

    const gridX = Math.floor(x / BLOCK_SIZE);
    const gridY = Math.floor(y / BLOCK_SIZE);
    const isVerticalBlock = (gridX + gridY) % 2 === 0;

    if (isVerticalBlock) {
        return x % PLANK_GAP === 0;
    } else {
        return y % PLANK_GAP === 0;
    }
};

/*
 * ? ? ? ? ?
 * ? ? ? ? ?
 * ? ? ? ? ?
 * ? ? ? ? ?
 */
const fallbackPixelPatternHandler: PixelPatternHandler = (x, y) => {
    const pattern = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const PATTERN_HEIGHT = pattern.length;
    const PATTERN_WIDTH = pattern[0].length;

    const localY = y % PATTERN_HEIGHT;
    const localX = x % PATTERN_WIDTH;

    return pattern[localY][localX] === 1;
};

const materialToPixelPatternHandler: {[key in RawMapLayerMaterial]: PixelPatternHandler} = {
    [RawMapLayerMaterial.Generic]: solidFillPixelPatternHandler,
    [RawMapLayerMaterial.Tile]: tilePixelPatternHandler,
    [RawMapLayerMaterial.Wood]: chevronPixelPatternHandler,
    [RawMapLayerMaterial.WoodHorizontal]: createPlankPixelPatternHandler(true),
    [RawMapLayerMaterial.WoodVertical]: createPlankPixelPatternHandler(false),
};

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
    let accentColors: LayerColors = ACCENT_COLORS;
    let backgroundAccentColors: LayerColors = BACKGROUND_ACCENT_COLORS;
    if (paletteMode === "dark") {
        colors = DARK_COLORS;
        backgroundColors = DARK_BACKGROUND_COLORS;

        accentColors = DARK_ACCENT_COLORS;
        backgroundAccentColors = DARK_BACKGROUND_ACCENT_COLORS;
    }

    [...layers].sort((a,b) => {
        return TYPE_SORT_MAPPING[a.type] - TYPE_SORT_MAPPING[b.type];
    }).forEach(layer => {
        let color: RGBColor = {r: 128, g: 128, b: 128};
        let accentColor: RGBColor = {r: 64, g: 192, b: 128};

        switch (layer.type) {
            case "floor":
                if (hasSelectedSegments) {
                    color = colors.floor;
                    accentColor = accentColors.floor;
                } else {
                    color = backgroundColors.floor;
                    accentColor = backgroundAccentColors.floor;
                }
                break;
            case "wall":
                if (hasSelectedSegments) {
                    color = colors.wall;
                    accentColor = accentColors.wall;
                } else {
                    color = backgroundColors.wall;
                    accentColor = backgroundAccentColors.wall;
                }
                break;
            case "segment": {
                const colorId = colorFinder.getColor((layer.metaData.segmentId ?? ""));

                if (hasSelectedSegments || selectedSegmentIds.includes(layer.metaData.segmentId ?? "")) {
                    color = colors.segments[colorId];
                    accentColor = accentColors.segments[colorId];
                } else {
                    color = backgroundColors.segments[colorId];
                    accentColor = backgroundAccentColors.segments[colorId];
                }
                break;
            }
        }

        let segmentLookupId = 0;
        if (layer.metaData.segmentId) {
            segmentLookupId = segmentLookupIdMapping.size + 1;
            segmentLookupIdMapping.set(segmentLookupId, layer.metaData.segmentId);
        }

        let pixelPatternHandler = solidFillPixelPatternHandler;
        if (layer.metaData.material) {
            pixelPatternHandler = materialToPixelPatternHandler[layer.metaData.material] ?? fallbackPixelPatternHandler;
        }

        for (let i = 0; i < layer.pixels.length; i = i + 2) {
            const offset = (
                (layer.pixels[i] - dimensions.x.min) +
                ((layer.pixels[i+1] - dimensions.y.min) * width)
            );
            const imgDataOffset = offset * 4;

            const pixelX = layer.pixels[i];
            const pixelY = layer.pixels[i+1];

            const pixelColor = pixelPatternHandler(pixelX, pixelY) ? accentColor : color;

            pixelData[imgDataOffset] = pixelColor.r;
            pixelData[imgDataOffset + 1] = pixelColor.g;
            pixelData[imgDataOffset + 2] = pixelColor.b;
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

export const ACCENT_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -7.5),
    wall: adjustRGBColorBrightness(COLORS.wall, -5),
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -7.5))
};

export const BACKGROUND_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -40),
    wall: adjustRGBColorBrightness(COLORS.wall, -15),
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -40))
};

export const BACKGROUND_ACCENT_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(BACKGROUND_COLORS.floor, -7.5),
    wall: adjustRGBColorBrightness(BACKGROUND_COLORS.wall, -5),
    segments: BACKGROUND_COLORS.segments.map(c => adjustRGBColorBrightness(c, -7.5))
};

export const DARK_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -20),
    wall: COLORS.wall,
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -20))
};

export const DARK_ACCENT_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(DARK_COLORS.floor, -25),
    wall: adjustRGBColorBrightness(DARK_COLORS.wall, -15),
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -25))
};


export const DARK_BACKGROUND_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(COLORS.floor, -50),
    wall: adjustRGBColorBrightness(COLORS.wall, -20),
    segments: COLORS.segments.map(c => adjustRGBColorBrightness(c, -50))
};

export const DARK_BACKGROUND_ACCENT_COLORS: LayerColors = {
    floor: adjustRGBColorBrightness(DARK_BACKGROUND_COLORS.floor, -10),
    wall: adjustRGBColorBrightness(DARK_BACKGROUND_COLORS.wall, -5),
    segments: DARK_BACKGROUND_COLORS.segments.map(c => adjustRGBColorBrightness(c, -10))
};
