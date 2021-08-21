import Color from 'color';
import Konva from 'konva';
import {ShapeConfig} from 'konva/lib/Shape';
import React from 'react';
import {Shape} from 'react-konva';
import {pairWiseArray} from '../utils';

export type PixelsProps = Konva.ShapeConfig & {
    pixels: number[];
    pixelSize: number;
    fill: string;
    sceneFunc?: never;
    scaleX?: never;
    scaleY?: never;
    scale?: never;
    x?: never;
    y?: never;
    width?: never;
    height?: never;
};

const PixelsShape = (props: PixelsProps): JSX.Element => {
    const {pixels, pixelSize, fill, ...shapeConfig} = props;

    const coords = React.useMemo(() => {return pairWiseArray(pixels)}, [pixels]);
    const {minX, maxX, minY, maxY} = React.useMemo(
        () =>
            {return coords.reduce(
                ({minX, maxX, minY, maxY}, [x, y]) => {return {
                    minX: x < minX ? x : minX,
                    minY: y < minY ? y : minY,
                    maxX: x > maxX ? x : maxX,
                    maxY: y > maxY ? y : maxY,
                }},
                {
                    minX: Infinity,
                    minY: Infinity,
                    maxX: -Infinity,
                    maxY: -Infinity,
                }
            )},
        [coords]
    );

    const imageCanvas = React.useMemo(() => {
        const width = maxX + 1 - minX;
        const height = maxY + 1 - minY;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            // eslint-disable-next-line no-console
            console.warn('No context for layer image');
            return;
        }
        canvas.width = width;
        canvas.height = height;

        const imageData = ctx.createImageData(width, height);
        const color = Color(fill);
        const {r, g, b} = color.rgb().object();
        const a = color.alpha() * 255;

        coords
            .map(([x, y]) => {return [x - minX, y - minY]})
            .forEach(([x, y]) => {
                const imgDataOffset = (x + y * width) * 4;

                imageData.data[imgDataOffset] = r;
                imageData.data[imgDataOffset + 1] = g;
                imageData.data[imgDataOffset + 2] = b;
                imageData.data[imgDataOffset + 3] = a;
            });

        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }, [coords, fill, maxX, maxY, minX, minY]);

    const sceneFunc = React.useCallback<Required<ShapeConfig>['sceneFunc']>(
        (context) => {
            if (imageCanvas === undefined) {
                return;
            }
            context._context.imageSmoothingEnabled = false;
            context.translate(minX, minY);
            context.drawImage(imageCanvas, 0, 0);
        },
        [imageCanvas, minX, minY]
    );

    return (
        <Shape
            listening={false}
            {...shapeConfig}
            scaleX={pixelSize}
            scaleY={pixelSize}
            sceneFunc={sceneFunc}
        />
    );
};

export default PixelsShape;
