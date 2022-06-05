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

export function RENDER_LAYERS_TO_IMAGEDATA(layers: Array<RawMapLayer>, pixelSize: number, width: number, height: number, colorsToUse: LayerColors) {
    const imageData = new ImageData(
        new Uint8ClampedArray( width * height * 4 ),
        width,
        height
    );

    const colorFinder = new FourColorTheoremSolver(layers, pixelSize);

    [...layers].sort((a,b) => {
        return TYPE_SORT_MAPPING[a.type] - TYPE_SORT_MAPPING[b.type];
    }).forEach(layer => {
        let color;

        switch (layer.type) {
            case "floor":
                color = colorsToUse.floor;
                break;
            case "wall":
                color = colorsToUse.wall;
                break;
            case "segment":
                color = colorsToUse.segments[colorFinder.getColor((layer.metaData.segmentId ?? ""))];
                break;
        }

        if (!color) {
            // eslint-disable-next-line no-console
            console.error(`Missing color for ${layer.type} with segment id '${layer.metaData.segmentId}'.`);
            color = {r: 128, g: 128, b: 128};
        }

        for (let i = 0; i < layer.pixels.length; i = i + 2) {
            const imgDataOffset = (layer.pixels[i] + layer.pixels[i+1] * width) * 4;

            imageData.data[imgDataOffset] = color.r;
            imageData.data[imgDataOffset + 1] = color.g;
            imageData.data[imgDataOffset + 2] = color.b;
            imageData.data[imgDataOffset + 3] = 255;
        }
    });

    return imageData;
}

// This is important because it determines the draw order
const TYPE_SORT_MAPPING = {
    "floor": 14,
    "segment": 15,
    "wall": 16
};

