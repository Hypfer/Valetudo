import {Canvas2DContextTrackingWrapper} from "../utils/Canvas2DContextTrackingWrapper";
import {PointCoordinates} from "../utils/types";
import React from "react";
import {isMobile} from "../utils/helpers";

export type StructureInterceptionHandlerResult = {
    stopPropagation: boolean; //Will always redraw
    deleteMe?: boolean;
    requestDraw?: boolean; //Optional if things should be redrawn without stopping the event propagation
    openDialog?: {
        title: string;
        body: string | React.ReactElement;
    }
}

abstract class Structure {
    public static TYPE = "Structure";

    public x0: number; // In pixel map space
    public y0: number; // In pixel map space
    public type: string;
    public isResizing = false;

    private static readonly MIPMAP_CACHE = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement>>();

    protected constructor(x0 : number, y0: number) {
        this.x0 = x0;
        this.y0 = y0;

        this.type = this.getType();
    }

    abstract draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number, pixelSize: number) : void

    protected getOptimizedImage(sourceImage: HTMLImageElement, width: number, height: number): CanvasImageSource {
        let entry = Structure.MIPMAP_CACHE.get(sourceImage);
        if (!entry) {
            entry = new Map();
            Structure.MIPMAP_CACHE.set(sourceImage, entry);
        }

        // Next larger power of 2
        const calculatedTier = Math.pow(
            2,
            Math.ceil(
                Math.log2(
                    Math.max(width, height)
                )
            )
        );
        const targetTier = Math.max(Math.min(calculatedTier, 1024), 32);


        if (calculatedTier > targetTier && !isMobile) {
            // Firefox Mobile 146 gets _very_ unhappy when trying to render svgs with gradients at 60fps at high scale factors
            // My tested desktop systems otoh don't really seem to care.
            // 
            // Hence, if desktop, just return the SVG. Otherwise, cap to 1024x1024px
            return sourceImage;
        }

        const existing = entry.get(targetTier);
        if (existing) {
            return existing;
        }

        const mipmap = this.generateMipmap(sourceImage, targetTier);
        entry.set(targetTier, mipmap);

        // Evict anything above 1MB in size (unless that's the currently requested one)
        if (targetTier > 512) {
            for (const tier of entry.keys()) {
                if (tier > 512 && tier !== targetTier) {
                    entry.delete(tier);
                }
            }
        }

        return mipmap;
    }

    /**
     * Handler for intercepting tap events on the canvas
     *
     * @param {PointCoordinates} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformationMatrixToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        return {
            stopPropagation: false
        };
    }

    abstract getType(): string

    /**
     * This is handler is called on each endTranslate.
     * It allows us to do post-processing such as snapping
     */
    //eslint-disable-next-line @typescript-eslint/no-empty-function
    postProcess() : void {
        //intentional
    }


    private generateMipmap(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        let targetWidth;
        let targetHeight;

        if (img.naturalWidth >= img.naturalHeight) {
            targetWidth = maxDimension;
            targetHeight = Math.round(maxDimension / aspectRatio);
        } else {
            // portrait
            targetHeight = maxDimension;
            targetWidth = Math.round(maxDimension * aspectRatio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        return canvas;
    }
}

export default Structure;
