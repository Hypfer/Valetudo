import {RawMapData} from "../api";
import {FourColorTheoremSolver} from "./utils/map-color-finder";
import {Theme} from "@mui/material";

type RGBColor = {
    r: number;
    g: number;
    b: number;
}

//adapted from https://stackoverflow.com/a/60880664
function adjustBrightness(hexInput: string, percent: number) : string {
    let hex = hexInput;

    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, "");

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, "$1$1");
    }

    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    const calculatedPercent = (100 + percent) / 100;

    r = Math.round(Math.min(255, Math.max(0, r * calculatedPercent)));
    g = Math.round(Math.min(255, Math.max(0, g * calculatedPercent)));
    b = Math.round(Math.min(255, Math.max(0, b * calculatedPercent)));

    let result = "#";

    result += r.toString(16).toUpperCase().padStart(2, "0");
    result += g.toString(16).toUpperCase().padStart(2, "0");
    result += b.toString(16).toUpperCase().padStart(2, "0");

    return result;
}

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

export class MapLayerRenderer {
    private canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D | null;
    private width: number;
    private height: number;

    private mapLayerRenderWebWorker: Worker;
    private mapLayerRenderWebWorkerAvailable = false;
    private pendingCallback: any;
    private colors: { floor: string; wall: string; segments: string[] };
    private darkColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };
    private lightColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };

    constructor() {
        this.width = 1;
        this.height = 1;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.ctx = this.canvas.getContext("2d");

        if (this.ctx === null) {
            throw new Error("Context is null");
        }

        this.colors = {
            floor:"#0076ff",
            wall: "#333333",
            segments: [
                "#19A1A1",
                "#7AC037",
                "#DF5618",
                "#F7C841",
                "#9966CC" // "fallback" color
            ]
        };

        this.darkColors = {
            floor: hexToRgb(adjustBrightness(this.colors.floor, -20)),
            wall: hexToRgb(this.colors.wall),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(adjustBrightness(e, -20));
            })
        };

        this.lightColors = {
            floor: hexToRgb(this.colors.floor),
            wall: hexToRgb(this.colors.wall),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(e);
            })
        };

        this.mapLayerRenderWebWorker = new Worker("mapLayerRenderWebWorker.js");

        this.mapLayerRenderWebWorker.onerror = (ev => {
            // eslint-disable-next-line no-console
            console.warn("MapLayerRenderWebWorker unavailable.");

            this.mapLayerRenderWebWorkerAvailable = false;
        });

        this.mapLayerRenderWebWorker.onmessage = (evt) => {
            if (evt.data.pixels !== undefined) {
                if (this.ctx !== null) {
                    const imageData = new ImageData(
                        new Uint8ClampedArray( evt.data.pixels ),
                        evt.data.width,
                        evt.data.height
                    );

                    this.ctx.putImageData(imageData, 0, 0);

                    if (typeof this.pendingCallback === "function") {
                        this.pendingCallback();
                        this.pendingCallback = undefined;
                    }
                }
            } else {
                if (evt.data.ready === true) {
                    this.mapLayerRenderWebWorkerAvailable = true;

                    return;
                }
            }
        };

        this.pendingCallback = undefined;
    }

    draw(data : RawMapData, theme: Theme): Promise<void> {
        let colorsToUse: { floor: RGBColor; wall: RGBColor; segments: RGBColor[]; };

        switch (theme.palette.mode) {
            case "light":
                colorsToUse = this.lightColors;
                break;
            case "dark":
                colorsToUse = this.darkColors;
                break;
        }

        return new Promise((resolve, reject) => {
            if (this.ctx === null) {
                throw new Error("Context is null");
            }

            //As the map data might change dimensions, we need to keep track of that.
            if (
                this.canvas.width !== Math.round(data.size.x / data.pixelSize) ||
                this.canvas.height !== Math.round(data.size.y / data.pixelSize)
            ) {
                this.width = Math.round(data.size.x / data.pixelSize);
                this.height = Math.round(data.size.y / data.pixelSize);

                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }
            this.ctx.clearRect(0, 0, this.width, this.height);

            if (data.layers.length > 0) {
                if (this.mapLayerRenderWebWorkerAvailable) {
                    this.mapLayerRenderWebWorker.postMessage( {
                        width: this.width,
                        height: this.height,
                        mapLayers: data.layers,
                        pixelSize: data.pixelSize,
                        colors: colorsToUse
                    });

                    //I'm not 100% sure if this cleanup is necessary but it should prevent eternally stuck promises
                    if (typeof this.pendingCallback === "function") {
                        this.pendingCallback();
                        this.pendingCallback = undefined;
                    }

                    this.pendingCallback = () => {
                        resolve();
                    };
                } else { //Fallback if there's no worker for some reason
                    const imageData = this.ctx.createImageData(this.width,this.height);

                    if (Array.isArray(data.layers)) {
                        data.layers.forEach(layer => {
                            if (
                                layer.pixels.length === 0 &&
                                layer.compressedPixels.length !== 0
                            ) {
                                for (let i = 0; i < layer.compressedPixels.length; i = i + 3) {
                                    const xStart = layer.compressedPixels[i];
                                    const y = layer.compressedPixels[i+1];
                                    const count = layer.compressedPixels[i+2];

                                    for (let j = 0; j < count; j++) {
                                        layer.pixels.push(
                                            xStart + j,
                                            y
                                        );
                                    }
                                }
                            }
                        });
                    }

                    const colorFinder = new FourColorTheoremSolver(data.layers, data.pixelSize);

                    [...data.layers].sort((a,b) => {
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
                            //eslint-disable-next-line no-console
                            console.error(`Missing color for ${layer.type} with segment id '${layer.metaData.segmentId}'.`);
                            color = {r: 0, g: 0, b: 0};
                        }

                        for (let i = 0; i < layer.pixels.length; i = i + 2) {
                            const imgDataOffset = (layer.pixels[i] + layer.pixels[i+1] * this.width) * 4;

                            imageData.data[imgDataOffset] = color.r;
                            imageData.data[imgDataOffset + 1] = color.g;
                            imageData.data[imgDataOffset + 2] = color.b;
                            imageData.data[imgDataOffset + 3] = 255;
                        }
                    });

                    this.ctx.putImageData(imageData, 0, 0);
                    resolve();
                }
            } else {
                resolve();
            }
        });
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}

// This is important because it determines the draw order
const TYPE_SORT_MAPPING = {
    "floor": 14,
    "segment": 15,
    "wall": 16
};

