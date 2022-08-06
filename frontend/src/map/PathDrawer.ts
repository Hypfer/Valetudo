import {RawMapEntity, RawMapEntityType} from "../api";
import {PaletteMode} from "@mui/material";

type PathDrawerOptions = {
    paths: Array<RawMapEntity>,
    mapWidth: number,
    mapHeight: number,
    pixelSize: number,
    paletteMode: PaletteMode,
    width?: number
};

export class PathDrawer {
    static drawPaths(options: PathDrawerOptions) : Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            if (options.paths.length > 0) {
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
            paths,
            pixelSize,
            width
        } = options;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}">`;
        let pathColor : string;

        switch (paletteMode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }

        paths.forEach(path => {
            svg += PathDrawer.createSVGPathFromPoints(
                path.points,
                path.type,
                pixelSize,
                pathColor,
                width
            );
        });

        svg += "</svg>";

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    private static createSVGPathFromPoints(
        points: Array<number>,
        type: RawMapEntityType,
        pixelSize: number,
        color: string,
        width?: number,
    ) {
        const pathWidth = width ?? 0.5;
        let svgPath = "<path d=\"";

        for (let i = 0; i < points.length; i = i + 2) {
            let type = "L";

            if (i === 0) {
                type = "M";
            }

            svgPath += `${type} ${points[i] / pixelSize} ${points[i + 1] / pixelSize} `;
        }

        svgPath += `" fill="none" stroke="${color}" stroke-width="${pathWidth}" stroke-linecap="round" stroke-linejoin="round"`;

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/>";

        return svgPath;
    }
}
