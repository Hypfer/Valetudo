import {RawMapEntity, RawMapEntityType} from "../api";
import {Theme} from "@mui/material";

export class PathDrawer {
    static drawPaths(paths: Array<RawMapEntity>, mapWidth: number, mapHeight: number, pixelSize: number, theme: Theme) : Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            if (paths.length > 0) {
                img.src = PathDrawer.createSVGDataUrlFromPaths(paths, mapWidth, mapHeight, pixelSize, theme);

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

    private static createSVGDataUrlFromPaths(paths: Array<RawMapEntity>, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}">`;
        let pathColor : string;

        switch (theme.palette.mode) {
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
                pathColor
            );
        });

        svg += "</svg>";

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    private static createSVGPathFromPoints(points: Array<number>, type: RawMapEntityType, pixelSize: number, color: string) {
        let svgPath = "<path d=\"";

        for (let i = 0; i < points.length; i = i + 2) {
            let type = "L";

            if (i === 0) {
                type = "M";
            }

            svgPath += `${type} ${points[i] / pixelSize} ${points[i + 1] / pixelSize} `;
        }

        svgPath += `" fill="none" stroke="${color}" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"`;

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/>";

        return svgPath;
    }
}
