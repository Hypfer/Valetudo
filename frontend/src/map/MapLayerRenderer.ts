import {RawMapData} from "../api";
import {Theme} from "@mui/material";
import {adjustColorBrightness} from "../utils";
import {RGBColor, LayerColors, RENDER_LAYERS_TO_IMAGEDATA} from "./MapLayerRenderUtils";



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
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    private mapLayerRenderWebWorker: Worker;
    private mapLayerRenderWebWorkerAvailable = false;
    private pendingCallback: (() => void) | undefined;
    private colors: { floor: string; wall: string; segments: string[] };
    private readonly darkColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };
    private readonly lightColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };

    constructor() {
        this.width = 1;
        this.height = 1;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.ctx = this.canvas.getContext("2d")!;

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
            floor: hexToRgb(adjustColorBrightness(this.colors.floor, -20)),
            wall: hexToRgb(this.colors.wall),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(adjustColorBrightness(e, -20));
            })
        };

        this.lightColors = {
            floor: hexToRgb(this.colors.floor),
            wall: hexToRgb(this.colors.wall),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(e);
            })
        };

        this.mapLayerRenderWebWorker = new Worker(new URL("./MapLayerRenderer.worker", import.meta.url));

        this.mapLayerRenderWebWorker.onerror = (ev => {
            // eslint-disable-next-line no-console
            console.warn("MapLayerRenderWebWorker unavailable.");

            this.mapLayerRenderWebWorkerAvailable = false;
        });

        this.mapLayerRenderWebWorker.onmessage = (evt) => {
            if (evt.data.pixels !== undefined) {
                const imageData = new ImageData(
                    new Uint8ClampedArray(evt.data.pixels),
                    evt.data.width,
                    evt.data.height
                );

                this.ctx.putImageData(imageData, 0, 0);

                if (typeof this.pendingCallback === "function") {
                    this.pendingCallback();
                    this.pendingCallback = undefined;
                }
            } else {
                if (evt.data.ready === true) {
                    // eslint-disable-next-line no-console
                    console.info("MapLayerRenderer.worker available");

                    this.mapLayerRenderWebWorkerAvailable = true;

                    return;
                }
            }
        };

        this.pendingCallback = undefined;
    }

    draw(data : RawMapData, theme: Theme): Promise<void> {
        let colorsToUse: LayerColors;

        switch (theme.palette.mode) {
            case "light":
                colorsToUse = this.lightColors;
                break;
            case "dark":
                colorsToUse = this.darkColors;
                break;
        }

        return new Promise((resolve, reject) => {
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
                        mapLayers: data.layers,
                        pixelSize: data.pixelSize,
                        width: this.width,
                        height: this.height,
                        colorsToUse: colorsToUse
                    });

                    //I'm not 100% sure if this cleanup is necessary, but it should prevent eternally stuck promises
                    if (typeof this.pendingCallback === "function") {
                        this.pendingCallback();
                        this.pendingCallback = undefined;
                    }

                    this.pendingCallback = () => {
                        resolve();
                    };
                } else { //Fallback if there's no worker for some reason
                    const imageData = RENDER_LAYERS_TO_IMAGEDATA(
                        data.layers,
                        data.pixelSize,
                        this.width,
                        this.height,
                        colorsToUse
                    );

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

