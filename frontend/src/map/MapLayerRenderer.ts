import {RawMapData} from "../api";
import {FourColorTheoremSolver} from "./utils/map-color-finder";

type RGBColor = {
    r: number;
    g: number;
    b: number;
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

    private readonly floorColor: RGBColor;
    private readonly wallColor: RGBColor;
    private readonly segmentColors: Array<RGBColor>;

    private mapLayerRenderWebWorker: Worker;
    private mapLayerRenderWebWorkerAvailable = false;
    private pendingCallback: any;

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

        this.floorColor = hexToRgb("#0076ff");
        this.wallColor = hexToRgb("#333333");
        this.segmentColors = [
            "#19A1A1",
            "#7AC037",
            "#DF5618",
            "#F7C841",
            "#9966CC" // "fallback" color
        ].map(function (e) {
            return hexToRgb(e);
        });


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

    draw(data : RawMapData): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ctx === null) {
                throw new Error("Context is null");
            }

            //As the map data might change dimensions, we need to keep track of that.
            if (this.canvas.width !== data.size.x || this.canvas.height !== data.size.y) {
                this.width = data.size.x;
                this.height = data.size.y;

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
                        pixelSize: data.pixelSize
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

                    const colorFinder = new FourColorTheoremSolver(data.layers, data.pixelSize);

                    [...data.layers].sort((a,b) => {
                        return TYPE_SORT_MAPPING[a.type] - TYPE_SORT_MAPPING[b.type];
                    }).forEach(layer => {
                        let color;
                        let alpha = 255;

                        switch (layer.type) {
                            case "floor":
                                color = this.floorColor;
                                alpha = 192;
                                break;
                            case "wall":
                                color = this.wallColor;
                                break;
                            case "segment":
                                color = this.segmentColors[colorFinder.getColor((layer.metaData.segmentId ?? ""))];
                                alpha = 192;
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
                            imageData.data[imgDataOffset + 3] = alpha;
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

