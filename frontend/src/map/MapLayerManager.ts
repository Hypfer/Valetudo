import {RawMapData} from "../api";
import {Theme} from "@mui/material";
import {adjustColorBrightness} from "../utils";
import {RGBColor, LayerColors, PROCESS_LAYERS} from "./MapLayerManagerUtils";

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

export class MapLayerManager {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    private mapLayerManagerWorker: Worker;
    private mapLayerManagerWorkerAvailable = false;
    private mapLayerManagerWorkerLastNonce = "";
    private pendingCallback: (() => void) | undefined;
    private colors: { floor: string; wall: string; segments: string[] };
    private readonly darkColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };
    private readonly darkBackgroundColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };
    private readonly lightColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };
    private readonly lightBackgroundColors: { floor: RGBColor; wall: RGBColor; segments: RGBColor[] };

    private segmentLookupInfo: {
        data: Uint8ClampedArray,
        width: number,
        height: number,
        top: number,
        left: number,
        idMapping: {[key: string]: string}
    };
    private selectedSegmentIds: string[];

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
        this.darkBackgroundColors = {
            floor: hexToRgb(adjustColorBrightness(this.colors.floor, -50)),
            wall: hexToRgb(adjustColorBrightness(this.colors.wall, -20)),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(adjustColorBrightness(e, -50));
            })
        };

        this.lightColors = {
            floor: hexToRgb(this.colors.floor),
            wall: hexToRgb(this.colors.wall),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(e);
            })
        };
        this.lightBackgroundColors = {
            floor: hexToRgb(adjustColorBrightness(this.colors.floor, -40)),
            wall: hexToRgb(adjustColorBrightness(this.colors.wall, -15)),
            segments: this.colors.segments.map((e) => {
                return hexToRgb(adjustColorBrightness(e, -40));
            })
        };

        this.mapLayerManagerWorker = new Worker(new URL("./MapLayerManager.worker", import.meta.url));

        this.mapLayerManagerWorker.onerror = (ev => {
            // eslint-disable-next-line no-console
            console.warn("MapLayerManager.worker unavailable.");

            this.mapLayerManagerWorkerAvailable = false;
        });

        this.mapLayerManagerWorker.onmessage = (evt) => {
            if (evt.data.pixelData !== undefined) {
                const imageData = new ImageData(
                    new Uint8ClampedArray(evt.data.pixelData),
                    evt.data.width,
                    evt.data.height
                );

                this.segmentLookupInfo = {
                    data: new Uint8ClampedArray(evt.data.segmentLookupData),
                    width: evt.data.width,
                    height: evt.data.height,
                    top: evt.data.top,
                    left: evt.data.left,
                    idMapping: evt.data.segmentLookupIdMapping
                };

                this.ctx.putImageData(imageData, evt.data.left, evt.data.top);

                if (typeof this.pendingCallback === "function") {
                    this.pendingCallback();
                    this.pendingCallback = undefined;
                }
            } else {
                if (evt.data.ready === true) {
                    // eslint-disable-next-line no-console
                    console.info("MapLayerManager.worker available");

                    this.mapLayerManagerWorkerAvailable = true;

                    return;
                }
            }
        };

        this.pendingCallback = undefined;

        this.segmentLookupInfo = {
            data: new Uint8ClampedArray(),
            width: 1,
            height: 1,
            top: 0,
            left: 0,
            idMapping: {}
        };
        this.selectedSegmentIds = [];
    }

    draw(data : RawMapData, theme: Theme): Promise<void> {
        let colors: LayerColors;
        let backgroundColors: LayerColors;

        switch (theme.palette.mode) {
            case "light":
                colors = this.lightColors;
                backgroundColors = this.lightBackgroundColors;
                break;
            case "dark":
                colors = this.darkColors;
                backgroundColors = this.darkBackgroundColors;
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
                if (this.mapLayerManagerWorkerAvailable) {
                    this.mapLayerManagerWorker.postMessage( {
                        mapLayers: data.metaData.nonce !== this.mapLayerManagerWorkerLastNonce ? data.layers : undefined,
                        pixelSize: data.pixelSize,
                        colors: colors,
                        backgroundColors: backgroundColors,
                        selectedSegmentIds: this.selectedSegmentIds
                    });

                    this.mapLayerManagerWorkerLastNonce = data.metaData.nonce;

                    //I'm not 100% sure if this cleanup is necessary, but it should prevent eternally stuck promises
                    if (typeof this.pendingCallback === "function") {
                        this.pendingCallback();
                        this.pendingCallback = undefined;
                    }

                    this.pendingCallback = () => {
                        resolve();
                    };
                } else { //Fallback if there's no worker for some reason
                    const rendered = PROCESS_LAYERS(
                        data.layers,
                        data.pixelSize,
                        colors,
                        backgroundColors,
                        this.selectedSegmentIds
                    );

                    this.segmentLookupInfo = {
                        data: new Uint8ClampedArray(rendered.segmentLookupData),
                        width: rendered.width,
                        height: rendered.height,
                        top: rendered.top,
                        left: rendered.left,
                        idMapping: rendered.segmentLookupIdMapping
                    };


                    this.ctx.putImageData(
                        new ImageData(
                            new Uint8ClampedArray(rendered.pixelData),
                            rendered.width,
                            rendered.height
                        ),
                        rendered.left,
                        rendered.top
                    );

                    resolve();
                }
            } else {
                resolve();
            }
        });
    }

    /**
     * 
     * @param {number} x - in cm coordinates
     * @param {number} y - in cm coordinates
     */
    getIntersectingSegment(x: number, y: number): string|null {
        const offset = Math.round(
            (Math.round(x) - this.segmentLookupInfo.left) +
            ((Math.round(y) - this.segmentLookupInfo.top) * this.segmentLookupInfo.width)
        );

        return this.segmentLookupInfo.idMapping[this.segmentLookupInfo.data[offset]] ?? null;
    }

    setSelectedSegmentIds(selectedSegmentIds: string[]) {
        this.selectedSegmentIds = selectedSegmentIds;
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}
