import {RawMapEntity, RawMapEntityType} from "../api";
import {Theme} from "@mui/material";

export class PathSVGDrawer {
    static drawPathSVG(path: RawMapEntity, mapWidth: number, mapHeight: number, pixelSize: number, theme: Theme) : Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (!(path.type === RawMapEntityType.Path || path.type === RawMapEntityType.PredictedPath)) {
                return reject("Not a path");
            }
            const img = new Image();

            if (path.points.length > 0) {
                img.src = PathSVGDrawer.createDataUrlFromPoints(path.points, path.type, mapWidth, mapHeight, pixelSize, theme);
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


    private static createDataUrlFromPoints(points: Array<number>, type: RawMapEntityType, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) {
        let svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}"><path d="`;
        let pathColor;

        switch (theme.palette.mode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }

        for (let i = 0; i < points.length; i = i + 2) {
            let type = "L";

            if (i === 0) {
                type = "M";
            }

            svgPath += `${type} ${points[i] / pixelSize} ${points[i + 1] / pixelSize} `;
        }

        svgPath += `" fill="none" stroke="${pathColor}" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"`;

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/></svg>";

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgPath)}`;

    }
}
