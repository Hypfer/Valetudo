import {RawMapEntity, RawMapEntityType} from "../api";
import {PaletteMode} from "@mui/material";
import {simplify} from "./utils/simplify_js";

type PathDrawerOptions = {
    pathMapEntities: Array<RawMapEntity>,
    mapWidth: number,
    mapHeight: number,
    pixelSize: number,
    paletteMode: PaletteMode,
    width?: number,
    opacity?: number,
};

export class PathDrawer {
    static drawPaths(options: PathDrawerOptions): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            if (options.pathMapEntities.length > 0) {
                img.src = PathDrawer.createSVGDataUrlFromPaths(options);

                img.decode().then(() => {
                    resolve(img);
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(img);
            }
        });
    }

    private static createSVGDataUrlFromPaths(options: PathDrawerOptions) {
        const {
            mapWidth,
            mapHeight,
            paletteMode,
            pathMapEntities,
            pixelSize,
            width,
            opacity
        } = options;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}">`;
        let pathColor: string;

        switch (paletteMode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }

        const paths = pathMapEntities.filter(e => e.type === RawMapEntityType.Path).map(e => e.points);
        if (paths.length > 0) {
            svg += PathDrawer.createSVGPathFromPaths(
                paths,
                RawMapEntityType.Path,
                pixelSize,
                pathColor,
                width,
                opacity
            );
        }

        const predictedPaths = pathMapEntities.filter(e => e.type === RawMapEntityType.PredictedPath).map(e => e.points);
        if (predictedPaths.length > 0) {
            svg += PathDrawer.createSVGPathFromPaths(
                predictedPaths,
                RawMapEntityType.PredictedPath,
                pixelSize,
                pathColor,
                width,
                opacity
            );
        }

        svg += "</svg>";

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    private static createSVGPathFromPaths(
        paths: Array<Array<number>>,
        type: RawMapEntityType,
        pixelSize: number,
        color: string,
        width?: number,
        opacity?: number,
    ) {
        const pathWidth = width ?? 0.5;
        const pathOpacity = opacity ?? 1;
        let commands = "";

        paths.forEach(points => {
            const simplifiedPoints = simplify(points, 0.8);

            for (let i = 0; i < simplifiedPoints.length; i = i + 2) {
                let type = "L";

                if (i === 0) {
                    type = "M";
                }

                commands += `${type} ${simplifiedPoints[i] / pixelSize} ${simplifiedPoints[i + 1] / pixelSize} `;
            }
        });

        let svgPath = `<path d="${commands}" fill="none" stroke="${color}" stroke-width="${pathWidth}" stroke-opacity="${pathOpacity}" stroke-linecap="round" stroke-linejoin="round"`;

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/>";

        return svgPath;
    }
}
